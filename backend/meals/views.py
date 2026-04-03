import json
from datetime import date, timedelta

from google import genai
from google.genai import types
from pydantic import ValidationError

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.conf import settings

from meals.models import WeeklyPlan, DayMeal, MealSlot, FoodItem
from meals.serializers import MealSlotSerializer, DayMealSerializer, WeeklyPlanSerializer
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
        week_start = today - timedelta(days=today.weekday())

        plan = WeeklyPlan.objects.filter(
            user=request.user,
            week_start_date=week_start,
        ).first()

        if not plan:
            return Response(
                {"detail": "No meal plan found for this week. Please generate one."},
                status=status.HTTP_404_NOT_FOUND
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
                status=status.HTTP_400_BAD_REQUEST
            )

        day_meal = DayMeal.objects.filter(
            weekly_plan__user=request.user,
            date=parsed_date,
        ).first()

        if not day_meal:
            return Response(
                {"detail": f"No meal plan found for {meal_date}."},
                status=status.HTTP_404_NOT_FOUND
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
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check all required fields
        if not all([profile.age, profile.height_cm, profile.weight_kg, profile.gender]):
            return Response(
                {"detail": "Profile incomplete. Fill age, height, weight, and gender."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete existing plan for this week if any
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        WeeklyPlan.objects.filter(
            user=request.user,
            week_start_date=week_start
        ).delete()

        # Generate fresh plan
        generator = MealPlanGenerator(profile)
        plan = generator.generate()

        if not plan:
            return Response(
                {"detail": "Meal plan generation failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            meal_date = date.fromisoformat(str(meal_date_str))
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the day meal
        day_meal = DayMeal.objects.filter(
            weekly_plan__user=request.user,
            date=meal_date,
        ).first()

        if not day_meal:
            return Response(
                {"detail": f"No meal plan found for {meal_date_str}."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            profile = request.user.profile
        except Exception:
            return Response(
                {"detail": "Profile not found."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get existing meal names to avoid repetition
        weekly_plan = day_meal.weekly_plan
        existing_names = list(
            MealSlot.objects.filter(
                day_meal__weekly_plan=weekly_plan
            ).exclude(
                day_meal=day_meal
            ).values_list('food_item__name', flat=True)
        )

        # Delete existing slots for this day
        day_meal.meal_slots.all().delete()

        # Regenerate using Gemini
        from meals.meal_generator import MealPlanGenerator
        from meals.schemas import DayMealSchema
        import json
        from google import genai
        from google.genai import types
        from django.conf import settings
        from pydantic import ValidationError

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        tdee = MealPlanGenerator(profile).calculate_tdee()
        beverage_cal = MealPlanGenerator(profile).calculate_beverage_calories()
        net_calories = tdee - beverage_cal

        avoid_str = ", ".join(existing_names) if existing_names else "none"

        prompt = f"""
You are a certified Indian nutritionist.
Regenerate meals for ONE day only.

User goal      : {profile.goal}
Diet           : {profile.diet_preference}
Fasting day    : {day_meal.is_fasting_day}
Meal budget    : {net_calories} kcal
Breakdown      : Breakfast ~25% ({round(net_calories * 0.25)} kcal)
                 Lunch     ~40% ({round(net_calories * 0.40)} kcal)
                 Dinner    ~35% ({round(net_calories * 0.35)} kcal)

AVOID these meals already used this week:
{avoid_str}

Return ONE day JSON only — no markdown, no explanation:
{{
  "day_number": {day_meal.day_of_week + 1},
  "date_label": "{meal_date.strftime('%A, %d %b')}",
  "is_fasting_day": {str(day_meal.is_fasting_day).lower()},
  "breakfast": {{
    "meal_type": "breakfast",
    "name": "...",
    "calories": 0,
    "protein": 0.0,
    "carbs": 0.0,
    "fats": 0.0,
    "fiber": 0.0,
    "serving_size": 1.0,
    "serving_unit": "plate",
    "ingredients": ["..."],
    "is_fasting_friendly": false,
    "is_jain_friendly": false
  }},
  "lunch": {{ ...same structure... }},
  "dinner": {{ ...same structure... }},
  "day_notes": "..."
}}
"""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.5,
                    response_mime_type="application/json",
                ),
            )
            raw = response.text.strip()
            data = json.loads(raw)
            validated = DayMealSchema(**data)

        except (ValidationError, json.JSONDecodeError, Exception) as e:
            return Response(
                {"detail": f"Regeneration failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Save regenerated slots
        for slot_type in ["breakfast", "lunch", "dinner"]:
            slot_data = getattr(validated, slot_type)

            # Parse ingredients safely
            ingredients_list = []
            for ing in (slot_data.ingredients or []):
                if isinstance(ing, str):
                    ingredients_list.append({'name': ing, 'quantity': None, 'unit': ''})
                elif hasattr(ing, 'dict'):
                    ingredients_list.append(ing.dict())
                elif isinstance(ing, dict):
                    ingredients_list.append(ing)

            food_item, _ = FoodItem.objects.get_or_create(
                name=slot_data.name,
                defaults={
                    'category':            slot_type,
                    'diet_type':           profile.diet_preference,
                    'calories':            slot_data.calories,
                    'protein_g':           slot_data.protein,
                    'carbs_g':             slot_data.carbs,
                    'fats_g':              slot_data.fats,
                    'fiber_g':             getattr(slot_data, 'fiber', 0),
                    'serving_size_g':      slot_data.serving_size,
                    'serving_unit':        slot_data.serving_unit,
                    'ingredients':         ingredients_list,
                    'is_fasting_friendly': slot_data.is_fasting_friendly,
                    'is_jain_friendly':    slot_data.is_jain_friendly,
                }
            )

            MealSlot.objects.create(
                day_meal=day_meal,
                slot=slot_type,
                food_item=food_item,
                quantity_g=slot_data.serving_size,
                calories=slot_data.calories,
                protein_g=slot_data.protein,
                carbs_g=slot_data.carbs,
                fats_g=slot_data.fats,
            )

        # Update day status
        day_meal.status = "regenerated"
        day_meal.day_notes = validated.day_notes
        day_meal.save()

        serializer = DayMealSerializer(day_meal)
        return Response(serializer.data, status=status.HTTP_200_OK)