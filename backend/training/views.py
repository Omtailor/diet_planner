from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import TrainingPlan, DayTraining
from .serializers import TrainingPlanSerializer, DayTrainingSerializer
from .training_generator import generate_training_plan


class DayRangeView(APIView):
    """GET /api/training/days-range/?start=YYYY-MM-DD&end=YYYY-MM-DD"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
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
        ).order_by("date")

        return Response(DayTrainingSerializer(days, many=True).data)


class WeeklyTrainingView(APIView):
    """GET /api/training/weekly/ — Get current week's training plan."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
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
        return Response(TrainingPlanSerializer(plan).data)


class AllDayTrainingsView(APIView):
    """GET /api/training/all-days/ — All day trainings across all plans, merged and sorted."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = (
            DayTraining.objects.filter(training_plan__user=request.user)
            .order_by("date")
            .select_related("training_plan")
        )

        if not days.exists():
            return Response({"error": "No training plans found."}, status=404)

        latest_plan = (
            TrainingPlan.objects.filter(user=request.user)
            .order_by("-week_start_date")
            .first()
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

        return Response(DayTrainingSerializer(day).data)


class GenerateTrainingPlanView(APIView):
    """POST /api/training/generate/ — Manually generate a new training plan."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
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
            return Response(TrainingPlanSerializer(existing).data, status=200)

        plan = generate_training_plan(request.user, profile, week_start=week_start)
        if not plan:
            return Response({"error": "Training plan generation failed."}, status=500)

        return Response(TrainingPlanSerializer(plan).data, status=201)


class LatestTrainingPlanView(APIView):
    """GET /api/training/latest/ — End date for next plan calculation."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        plan = (
            TrainingPlan.objects.filter(user=request.user)
            .order_by("-week_start_date")
            .first()
        )
        if not plan:
            return Response({"detail": "No training plan found."}, status=404)
        return Response(
            {
                "week_start_date": plan.week_start_date,
                "week_end_date": plan.week_end_date,
            }
        )
