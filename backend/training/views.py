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
        week_start = today - timedelta(days=today.weekday())
        try:
            plan = TrainingPlan.objects.get(user=request.user, week_start_date=week_start)
        except TrainingPlan.DoesNotExist:
            return Response({'error': 'No training plan found for this week.'}, status=404)
        return Response(TrainingPlanSerializer(plan).data)


class DayTrainingView(APIView):
    """GET /api/training/day/<date>/ — Get a single day's training."""
    permission_classes = [IsAuthenticated]

    def get(self, request, training_date):
        try:
            target_date = date.fromisoformat(training_date)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        try:
            day = DayTraining.objects.get(
                training_plan__user=request.user,
                date=target_date,
            )
        except DayTraining.DoesNotExist:
            return Response({'error': 'No training found for this date.'}, status=404)

        return Response(DayTrainingSerializer(day).data)


class GenerateTrainingPlanView(APIView):
    """POST /api/training/generate/ — Manually generate a new training plan."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            profile = request.user.profile
        except Exception:
            return Response({'error': 'Profile not found. Complete onboarding first.'}, status=400)

        plan = generate_training_plan(request.user, profile)
        if not plan:
            return Response({'error': 'Training plan generation failed.'}, status=500)

        return Response(TrainingPlanSerializer(plan).data, status=201)