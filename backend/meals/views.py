import json
import logging
import threading
from datetime import date, timedelta

from google import genai
from google.genai import types
from pydantic import ValidationError

logger = logging.getLogger(__name__)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.conf import settings

from meals.models import WeeklyPlan, DayMeal, MealSlot, FoodItem
from meals.serializers import (
    MealSlotSerializer,
    DayMealSerializer,
    WeeklyPlanSerializer,
)
from meals.schemas import DayMealSchema
from meals.meal_generator import MealPlanGenerator


def run_background_tasks(user, profile, week_start=None):
    from django.db import close_old_connections

    close_old_connections()

    try:
        from grocery.grocery_generator import generate_grocery_list

        generate_grocery_list(user)
    except Exception as e:
        logger.error(
            "[BG] Grocery generation failed for user %s: %s", user.id, e, exc_info=True
        )

    close_old_connections()


class WeeklyPlanView(APIView):
    """
    GET /api/meals/weekly/
    Returns current week's full 7-day meal plan for logged-in user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()

        plan = (
            WeeklyPlan.objects.filter(
                user=request.user,
                week_start_date__lte=today,
                week_end_date__gte=today,
            )
            .order_by("-week_start_date")
            .first()
        )

        if not plan:
            return Response(
                {"detail": "No meal plan found for this week. Please generate one."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = WeeklyPlanSerializer(plan)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DayMealView(APIView):
    """
    GET /api/meals/day/<date>/
    Returns a single day's meals.
    Date format: YYYY-MM-DD
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, meal_date):
        try:
            parsed_date = date.fromisoformat(str(meal_date))
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        day_meal = DayMeal.objects.filter(
            weekly_plan__user=request.user,
            date=parsed_date,
        ).first()

        if not day_meal:
            return Response(
                {"detail": f"No meal plan found for {meal_date}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = DayMealSerializer(day_meal)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GeneratePlanView(APIView):
    """
    POST /api/meals/generate/
    Manually trigger 3-day meal plan generation.
    Deletes existing plan for this week and generates fresh.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            profile = request.user.profile
        except Exception:
            return Response(
                {"detail": "Profile not found. Complete onboarding first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check all required fields
        if not all([profile.age, profile.height_cm, profile.weight_kg, profile.gender]):
            return Response(
                {"detail": "Profile incomplete. Fill age, height, weight, and gender."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete existing plan that covers today if any
        today = date.today()
        WeeklyPlan.objects.filter(
            user=request.user,
            week_start_date__lte=today,
            week_end_date__gte=today,
        ).delete()

        # Generate fresh plan
        generator = MealPlanGenerator(profile)
        plan = generator.generate()

        if not plan:
            return Response(
                {"detail": "Meal plan generation failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        thread = threading.Thread(
            target=run_background_tasks,
            args=(request.user, profile),
        )
        thread.daemon = True
        thread.start()

        serializer = WeeklyPlanSerializer(plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RegenerateDayView(APIView):
    """
    POST /api/meals/regenerate-day/
    Regenerate meals for a single day.

    Request body:
    {
        "date": "2026-04-02"
    }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        meal_date_str = request.data.get("date")

        if not meal_date_str:
            return Response(
                {"detail": "date is required. Format: YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            meal_date = date.fromisoformat(str(meal_date_str))
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        day_meal = DayMeal.objects.filter(
            weekly_plan__user=request.user,
            date=meal_date,
        ).first()

        if not day_meal:
            return Response(
                {"detail": f"No meal plan found for {meal_date_str}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            profile = request.user.profile
        except Exception:
            return Response(
                {"detail": "Profile not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        generator = MealPlanGenerator(profile)
        success = generator.regenerate_day(day_meal)

        if not success:
            return Response(
                {"detail": "Regeneration failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = DayMealSerializer(day_meal)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GenerateNextWeekView(APIView):
    """
    POST /api/meals/generate-next-week/
    Generates meal plan for next 3 days from last plan end date + 1.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        profile = getattr(user, "profile", None)

        # ── Guard: no profile at all
        if not profile:
            return Response(
                {
                    "detail": "PROFILE_INCOMPLETE",
                    "message": "Please complete your profile first.",
                },
                status=400,
            )

        # ── Guard: incomplete onboarding (check required fields)
        required_fields = [
            "age",
            "weight_kg",
            "height_cm",
            "goal",
            "diet_preference",
            "gender",
        ]
        missing = [f for f in required_fields if not getattr(profile, f, None)]
        if missing:
            return Response(
                {
                    "detail": "PROFILE_INCOMPLETE",
                    "message": "Please complete your onboarding first.",
                },
                status=400,
            )

        # ── Determine next week_start ──────────────────────────────────────────
        latest_plan = (
            WeeklyPlan.objects.filter(user=request.user)
            .order_by("-week_end_date")
            .first()
        )

        if latest_plan:
            week_start = latest_plan.week_end_date + timedelta(days=1)
            # Don't generate in the past — clamp to today if needed
            if week_start < date.today():
                week_start = date.today()
        else:
            # No plan at all → start fresh from today
            week_start = date.today()

        # ── Check if plan for this period already exists ───────────────────────
        existing = WeeklyPlan.objects.filter(
            user=request.user, week_start_date=week_start
        ).first()
        if existing:
            return Response({"detail": "Next plan already exists."}, status=400)

        # ── Generate ───────────────────────────────────────────────────────────
        try:
            generator = MealPlanGenerator(profile)
            plan = generator.generate(week_start=week_start)
            if not plan:
                return Response(
                    {"detail": "Generation failed. Please try again."}, status=500
                )
        except Exception as e:
            logger.error(f"[generate_next_week] Failed: {e}")
            return Response(
                {"detail": "Generation failed. Please try again."}, status=500
            )

        thread = threading.Thread(
            target=run_background_tasks,
            args=(request.user, profile),
            kwargs={"week_start": week_start},
        )
        thread.daemon = True
        thread.start()

        return Response(
            {
                "detail": "Plan generated successfully.",
                "week_start_date": str(plan.week_start_date),
                "week_end_date": str(plan.week_end_date),
            },
            status=status.HTTP_201_CREATED,
        )


class LatestPlanView(APIView):
    """
    GET /api/meals/latest/
    Returns the latest meal plan (highest week_start_date) for logged-in user.
    Used by frontend to determine when next week's plan can be generated.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        plan = (
            WeeklyPlan.objects.filter(user=request.user)
            .order_by("-week_start_date")
            .first()
        )

        if not plan:
            return Response(
                {"detail": "No meal plan found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Return only what the frontend needs — lightweight response
        return Response(
            {
                "week_start_date": plan.week_start_date,
                "week_end_date": plan.week_end_date,
            },
            status=status.HTTP_200_OK,
        )
