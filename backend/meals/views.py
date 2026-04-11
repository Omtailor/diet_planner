import json
from datetime import date

from google import genai
from google.genai import types
from pydantic import ValidationError

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
    Manually trigger 7-day meal plan generation.
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

        try:
            from grocery.grocery_generator import generate_grocery_list

            generate_grocery_list(request.user)
        except Exception as e:
            print(f"[GeneratePlan] Grocery list generation failed: {e}")

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
    Generates meal plan for next 7 days.
    Starts from max(today, latest_plan_end + 1) — never generates backwards.
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

        if not all([profile.age, profile.height_cm, profile.weight_kg, profile.gender]):
            return Response(
                {"detail": "Profile incomplete."}, status=status.HTTP_400_BAD_REQUEST
            )

        today = date.today()
        from datetime import timedelta

        # ✅ FIXED: Get LATEST plan, not strictly "current week"
        latest_plan = (
            WeeklyPlan.objects.filter(user=request.user)
            .order_by("-week_start_date")
            .first()
        )

        if not latest_plan:
            return Response(
                {"detail": "No meal plan found. Generate your first plan first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ✅ Never generate backwards — start from max(today, plan_end + 1)
        day_after_latest = latest_plan.week_end_date + timedelta(days=1)
        next_week_start = max(today, day_after_latest)

        # Check if a plan already exists starting on that date
        already_exists = WeeklyPlan.objects.filter(
            user=request.user,
            week_start_date=next_week_start,
        ).exists()

        if already_exists:
            return Response(
                {"detail": "Next week plan already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate meal plan
        generator = MealPlanGenerator(profile)
        try:
            plan = generator.generate(week_start=next_week_start)
            print(f"[DEBUG] Plan generated: {plan}")
        except Exception as e:
            print(f"[DEBUG] generate() threw: {e}")
            return Response({"detail": f"Debug: {str(e)}"}, status=500)

        if not plan:
            return Response(
                {"detail": "Next week meal plan generation failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Generate training plan
        try:
            from training.training_generator import generate_training_plan

            generate_training_plan(request.user, profile, week_start=next_week_start)
        except Exception as e:
            print(f"[GenerateNextWeek] Training plan failed: {e}")

        # Generate grocery list
        try:
            from grocery.grocery_generator import generate_grocery_list

            generate_grocery_list(request.user)
        except Exception as e:
            print(f"[GenerateNextWeek] Grocery generation failed: {e}")

        serializer = WeeklyPlanSerializer(plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
