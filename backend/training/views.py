from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import TrainingPlan, DayTraining
from .serializers import TrainingPlanSerializer, DayTrainingSerializer
from .training_generator import generate_training_plan


class WeeklyTrainingView(APIView):
    """GET /api/training/weekly/ — Get current week's training plan."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # We must return the latest plan chronologically. 
        # If we prioritize a plan covering 'today', the newly generated
        # future plans (e.g. Apr 17-19) would be hidden while the old plan
        # (Apr 14-16) is still active.
        plan = (
            TrainingPlan.objects.filter(user=request.user)
            .order_by("-week_start_date")
            .first()
        )

        if not plan:
            return Response({"error": "No training plan found."}, status=404)

        return Response(TrainingPlanSerializer(plan).data)


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
        profile = getattr(user, 'profile', None)

        # ── Guard: no profile at all
        if not profile:
            return Response(
                {'detail': 'PROFILE_INCOMPLETE', 'message': 'Please complete your profile first.'},
                status=400
            )

        # ── Guard: incomplete onboarding (check required fields)
        required_fields = ['age', 'weight_kg', 'height_cm', 'goal', 'gender']
        missing = [f for f in required_fields if not getattr(profile, f, None)]
        if missing:
            return Response(
                {'detail': 'PROFILE_INCOMPLETE', 'message': 'Please complete your onboarding first.'},
                status=400
            )

        # ── Guard: health_time_minutes is 0 (user has no time set)
        if getattr(profile, 'health_time_minutes', 0) == 0:
            return Response(
                {
                    'detail': 'HEALTH_TIME_ZERO',
                    'message': 'Please set your daily health time before generating a training plan.'
                },
                status=400
            )

        # Support optional week_start from request body (for next-week generation)
        week_start_str = request.data.get("week_start")
        if week_start_str:
            try:
                week_start = date.fromisoformat(week_start_str)
            except ValueError:
                return Response(
                    {"error": "Invalid week_start format. Use YYYY-MM-DD."}, status=400
                )
        else:
            week_start = date.today()  # ← start from today, not Monday

        existing = TrainingPlan.objects.filter(
            user=request.user,
            week_start_date=week_start
        ).first()
        if existing:
            return Response(TrainingPlanSerializer(existing).data, status=200)

        plan = generate_training_plan(request.user, profile, week_start=week_start)
        if not plan:
            return Response({"error": "Training plan generation failed."}, status=500)

        return Response(TrainingPlanSerializer(plan).data, status=201)


class LatestTrainingPlanView(APIView):
    """GET /api/training/latest/ metadata — end date for next plan calculation."""

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
