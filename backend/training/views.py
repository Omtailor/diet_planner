from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import TrainingPlan, DayTraining
from .serializers import TrainingPlanSerializer, DayTrainingSerializer
from .training_generator import generate_training_plan


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
            return Response(
                {"error": "No training plan found for this week."}, status=404
            )

        # Added the missing return for the successful scenario
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
        try:
            profile = request.user.profile
        except Exception:
            return Response(
                {"error": "Profile not found. Complete onboarding first."}, status=400
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

        plan = generate_training_plan(request.user, profile, week_start=week_start)
        if not plan:
            return Response({"error": "Training plan generation failed."}, status=500)

        return Response(TrainingPlanSerializer(plan).data, status=201)
