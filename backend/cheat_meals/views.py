import os
from datetime import date
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import CheatMeal, CheatMealImage
from .serializers import (
    CheatMealSerializer, CheatMealCreateSerializer,
    ManualCheatMealSerializer, AskMoreSerializer,
)
from .ai_analyzer import analyze_food_images, analyze_food_text
from .calorie_adjustment import apply_cheat_meal_adjustment


class ImageCheatMealView(APIView):
    """POST /api/cheat-meals/image/ — Upload 1-2 food images for AI analysis."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        images = request.FILES.getlist('images')
        if not images:
            return Response({'error': 'At least one image is required.'}, status=400)
        if len(images) > 2:
            return Response({'error': 'Maximum 2 images allowed.'}, status=400)

        cheat_meal = None
        try:
            cheat_meal = CheatMeal.objects.create(
                user=request.user,
                entry_method='image',
                notes=request.data.get('notes', ''),
                meal_date=date.today(),                         # ← required field
            )
            temp_paths = []
            for img_file in images:
                img_obj = CheatMealImage.objects.create(cheat_meal=cheat_meal, image=img_file)
                temp_paths.append(os.path.join(settings.MEDIA_ROOT, str(img_obj.image)))

            ai_data = analyze_food_images(temp_paths)
            cheat_meal.food_name = ai_data.get('food_name', '')
            cheat_meal.quantity_description = ai_data.get('portion_description', '')  # ← fixed
            cheat_meal.ai_estimated_calories = int(ai_data.get('estimated_calories', 0))
            cheat_meal.ai_confidence = float(ai_data.get('confidence_level', 0.5))    # ← fixed
            cheat_meal.ai_raw_response = ai_data                                       # ← fixed

            if request.data.get('user_edited_calories'):
                cheat_meal.user_edited_calories = int(request.data['user_edited_calories'])

            cheat_meal.save()
            apply_cheat_meal_adjustment(request.user, cheat_meal)
            return Response(CheatMealSerializer(cheat_meal).data, status=201)

        except Exception as e:
            if cheat_meal and cheat_meal.pk:
                cheat_meal.delete()
            return Response({'error': f'AI analysis failed: {str(e)}'}, status=500)


class ManualCheatMealView(APIView):
    """POST /api/cheat-meals/manual/ — Text description → AI calorie estimate."""
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = ManualCheatMealSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        description = serializer.validated_data['manual_description']
        try:
            ai_data = analyze_food_text(description)
        except Exception as e:
            return Response({'error': f'AI analysis failed: {str(e)}'}, status=500)

        # AI needs more info → return 202 with pending cheat meal ID
        if not ai_data.get('ready', True):
            cheat_meal = CheatMeal.objects.create(
                user=request.user,
                entry_method='manual',
                notes=serializer.validated_data.get('notes', ''),
                ai_raw_response={'follow_up_question': ai_data.get('follow_up_question')},  # ← fixed
                meal_date=date.today(),                                                      # ← required
            )
            return Response({
                'status': 'follow_up_needed',
                'cheat_meal_id': cheat_meal.id,
                'follow_up_question': ai_data.get('follow_up_question'),
            }, status=202)

        cheat_meal = CheatMeal.objects.create(
            user=request.user,
            entry_method='manual',
            food_name=ai_data.get('food_name', ''),
            quantity_description=ai_data.get('portion_description', ''),   # ← fixed
            ai_estimated_calories=int(ai_data.get('estimated_calories', 0)),
            ai_confidence=float(ai_data.get('confidence_level', 0.5)),     # ← fixed
            ai_raw_response=ai_data,                                        # ← fixed
            notes=serializer.validated_data.get('notes', ''),
            user_edited_calories=serializer.validated_data.get('user_edited_calories'),
            meal_date=date.today(),                                         # ← required
        )
        apply_cheat_meal_adjustment(request.user, cheat_meal)
        return Response(CheatMealSerializer(cheat_meal).data, status=201)


class ManualCheatMealFollowUpView(APIView):
    """POST /api/cheat-meals/manual/followup/ — Answer AI's follow-up question."""
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = AskMoreSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        try:
            cheat_meal = CheatMeal.objects.get(
                id=serializer.validated_data['cheat_meal_id'], user=request.user
            )
        except CheatMeal.DoesNotExist:
            return Response({'error': 'Cheat meal not found.'}, status=404)

        answer = serializer.validated_data['answer']
        try:
            ai_data = analyze_food_text(cheat_meal.food_name or '', follow_up_answer=answer)  # ← use food_name (no manual_description field)
        except Exception as e:
            return Response({'error': f'AI analysis failed: {str(e)}'}, status=500)

        # Enforce max 2 questions — force estimate if still not ready
        if not ai_data.get('ready', True):
            ai_data = {
                'ready': True,
                'food_name': cheat_meal.food_name or 'Unknown food',
                'portion_description': 'estimated',
                'estimated_calories': 400,
                'protein_g': 0, 'carbs_g': 0, 'fats_g': 0,
                'confidence_level': 0.4,
                'notes': 'Best-effort estimate after 2 questions.'
            }

        cheat_meal.food_name = ai_data.get('food_name', '')
        cheat_meal.quantity_description = ai_data.get('portion_description', '')  # ← fixed
        cheat_meal.ai_estimated_calories = int(ai_data.get('estimated_calories', 0))
        cheat_meal.ai_confidence = float(ai_data.get('confidence_level', 0.4))    # ← fixed
        cheat_meal.ai_raw_response = ai_data                                       # ← fixed
        cheat_meal.save()
        apply_cheat_meal_adjustment(request.user, cheat_meal)
        return Response(CheatMealSerializer(cheat_meal).data)


class EditCheatMealCaloriesView(APIView):
    """PATCH /api/cheat-meals/<id>/edit/ — User overrides AI-estimated calories."""
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def patch(self, request, pk):
        try:
            cheat_meal = CheatMeal.objects.get(id=pk, user=request.user)
        except CheatMeal.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        cal = request.data.get('user_edited_calories')
        if cal is None or not isinstance(cal, (int, float)) or cal < 0:
            return Response({'error': 'user_edited_calories must be a non-negative number.'}, status=400)

        cheat_meal.user_edited_calories = cal
        cheat_meal.save()
        apply_cheat_meal_adjustment(request.user, cheat_meal)
        return Response(CheatMealSerializer(cheat_meal).data)


class CheatMealHistoryView(APIView):
    """GET /api/cheat-meals/history/ — All cheat meals, newest first."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        meals = CheatMeal.objects.filter(user=request.user).order_by('-logged_at')  # ← fixed
        return Response(CheatMealSerializer(meals, many=True).data)