from datetime import date, timedelta
import logging
import time
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import TrainingPlan, DayTraining
from .serializers import TrainingPlanSerializer, DayTrainingSerializer
from .training_generator import generate_training_plan


logger = logging.getLogger(__name__)


class DayRangeView(APIView):
    """GET /api/training/days-range/?start=YYYY-MM-DD&end=YYYY-MM-DD"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_time = time.perf_counter()
        start_str = request.query_params.get("start")
        end_str = request.query_params.get("end")
        try:
            start = date.fromisoformat(start_str)
            end = date.fromisoformat(end_str)
        except (TypeError, ValueError):
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."}, status=400
            )

        days = DayTraining.objects.filter(
            training_plan__user=request.user,
            date__gte=start,
            date__lte=end,
        ).select_related("training_plan").prefetch_related("exercises").order_by("date")

        # Store prefetched exercises to avoid N+1 in serializer
        for day in days:
            day._prefetched_exercises = list(day.exercises.all())

        logger.info(
            "[TrainingAPI] days-range user=%s start=%s end=%s count=%s took=%.3fs",
            request.user.id,
            start,
            end,
            days.count(),
            time.perf_counter() - start_time,
        )

        return Response(DayTrainingSerializer(days, many=True).data)


class WeeklyTrainingView(APIView):
    """GET /api/training/weekly/ — Get current week's training plan."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_time = time.perf_counter()
        today = date.today()
        plan = (
            TrainingPlan.objects.filter(
                user=request.user,
                week_start_date__lte=today,
                week_end_date__gte=today,
            )
            .order_by("-week_start_date")
            .first()
        )
        if not plan:
            plan = (
                TrainingPlan.objects.filter(user=request.user)
                .order_by("-week_start_date")
                .first()
            )
        if not plan:
            return Response({"error": "No training plan found."}, status=404)

        logger.info(
            "[TrainingAPI] weekly user=%s plan_id=%s took=%.3fs",
            request.user.id,
            plan.id,
            time.perf_counter() - start_time,
        )

        return Response(TrainingPlanSerializer(plan).data)


class AllDayTrainingsView(APIView):
    """GET /api/training/all-days/ — All day trainings across all plans, merged and sorted."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_time = time.perf_counter()
        days = (
            DayTraining.objects.filter(training_plan__user=request.user)
            .order_by("date")
            .select_related("training_plan")
            .prefetch_related("exercises")
        )

        if not days.exists():
            return Response({"error": "No training plans found."}, status=404)
        
        # Store prefetched exercises to avoid N+1 in serializer
        for day in days:
            day._prefetched_exercises = list(day.exercises.all())

        latest_plan = (
            TrainingPlan.objects.filter(user=request.user)
            .order_by("-week_start_date")
            .first()
        )

        logger.info(
            "[TrainingAPI] all-days user=%s count=%s took=%.3fs",
            request.user.id,
            days.count(),
            time.perf_counter() - start_time,
        )

        return Response(
            {
                "week_end_date": latest_plan.week_end_date if latest_plan else None,
                "day_trainings": DayTrainingSerializer(days, many=True).data,
            }
        )


class DayTrainingView(APIView):
    """GET /api/training/day/<date>/ — Get a single day's training."""

    permission_classes = [IsAuthenticated]

    def get(self, request, training_date):
        start_time = time.perf_counter()
        try:
            target_date = date.fromisoformat(training_date)
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."}, status=400
            )

        try:
            day = DayTraining.objects.get(
                training_plan__user=request.user,
                date=target_date,
            )
        except DayTraining.DoesNotExist:
            return Response({"error": "No training found for this date."}, status=404)

        logger.info(
            "[TrainingAPI] day user=%s date=%s day_id=%s took=%.3fs",
            request.user.id,
            target_date,
            day.id,
            time.perf_counter() - start_time,
        )

        return Response(DayTrainingSerializer(day).data)


class GenerateTrainingPlanView(APIView):
    """POST /api/training/generate/ — Manually generate a new training plan."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        start_time = time.perf_counter()
        user = request.user
        profile = getattr(user, "profile", None)

        if not profile:
            return Response(
                {
                    "detail": "PROFILE_INCOMPLETE",
                    "message": "Please complete your profile first.",
                },
                status=400,
            )

        required_fields = ["age", "weight_kg", "height_cm", "goal", "gender"]
        missing = [f for f in required_fields if not getattr(profile, f, None)]
        if missing:
            return Response(
                {
                    "detail": "PROFILE_INCOMPLETE",
                    "message": "Please complete your onboarding first.",
                },
                status=400,
            )

        if getattr(profile, "health_time_minutes", 0) == 0:
            return Response(
                {
                    "detail": "HEALTH_TIME_ZERO",
                    "message": "Please set your daily health time before generating a training plan.",
                },
                status=400,
            )

        week_start_str = request.data.get("week_start")
        if week_start_str:
            try:
                week_start = date.fromisoformat(week_start_str)
            except ValueError:
                return Response(
                    {"error": "Invalid week_start format. Use YYYY-MM-DD."}, status=400
                )
        else:
            latest_plan = (
                TrainingPlan.objects.filter(user=request.user)
                .order_by("-week_end_date")
                .first()
            )
            if latest_plan:
                week_start = latest_plan.week_end_date + timedelta(days=1)
                if week_start < date.today():
                    week_start = date.today()
            else:
                week_start = date.today()

        existing = TrainingPlan.objects.filter(
            user=request.user, week_start_date=week_start
        ).first()
        if existing:
            logger.info(
                "[TrainingAPI] generate existing user=%s week_start=%s plan_id=%s took=%.3fs",
                user.id,
                week_start,
                existing.id,
                time.perf_counter() - start_time,
            )
            return Response(TrainingPlanSerializer(existing).data, status=200)

        # Generate plan - wrapped in try-except to catch ALL exceptions
        try:
            logger.info(
                "[TrainingAPI] generate start user=%s week_start=%s",
                user.id,
                week_start,
            )
            plan = generate_training_plan(request.user, profile, week_start=week_start)
            if not plan:
                logger.error(f"[GenerateTrainingPlanView] Generation returned None for user {request.user.id}")
                return Response({"error": "Training plan generation failed."}, status=500)

            logger.info(
                "[TrainingAPI] generate success user=%s plan_id=%s days=%s took=%.3fs",
                user.id,
                plan.id,
                plan.day_trainings.count(),
                time.perf_counter() - start_time,
            )

            return Response(TrainingPlanSerializer(plan).data, status=201)
            
        except Exception as e:
            logger.error(
                f"[GenerateTrainingPlanView] Generation failed for user {request.user.id}: {e}",
                exc_info=True
            )
            return Response(
                {"error": f"Training plan generation failed: {str(e)}. Please try again."},
                status=500
            )


class LatestTrainingPlanView(APIView):
    """GET /api/training/latest/ — End date for next plan calculation."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_time = time.perf_counter()
        plan = (
            TrainingPlan.objects.filter(user=request.user)
            .order_by("-week_start_date")
            .first()
        )
        if not plan:
            return Response({"detail": "No training plan found."}, status=404)

        logger.info(
            "[TrainingAPI] latest user=%s plan_id=%s took=%.3fs",
            request.user.id,
            plan.id,
            time.perf_counter() - start_time,
        )

        return Response(
            {
                "week_start_date": plan.week_start_date,
                "week_end_date": plan.week_end_date,
            }
        )
