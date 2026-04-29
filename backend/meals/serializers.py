from rest_framework import serializers
from .models import FoodItem, MealSlot, DayMeal, WeeklyPlan


class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = [
            "id",
            "name",
            "category",
            "diet_type",
            "calories",
            "protein_g",
            "carbs_g",
            "fats_g",
            "fiber_g",
            "serving_size_g",
            "serving_unit",
            "ingredients",
            "is_fasting_friendly",
            "is_jain_friendly",
        ]


class MealSlotSerializer(serializers.ModelSerializer):
    food_item = FoodItemSerializer(read_only=True)

    class Meta:
        model = MealSlot
        fields = [
            "id",
            "slot",
            "food_item",
            "quantity_g",
            "calories",
            "protein_g",
            "carbs_g",
            "fats_g",
        ]


class DayMealSerializer(serializers.ModelSerializer):
    meal_slots = MealSlotSerializer(many=True, read_only=True)

    class Meta:
        model = DayMeal
        fields = [
            "id",
            "day_of_week",
            "date",
            "is_fasting_day",
            "total_calories",
            "total_protein_g",
            "total_carbs_g",
            "total_fats_g",
            "status",
            "day_notes",
            "meal_slots",
        ]


class WeeklyPlanSerializer(serializers.ModelSerializer):
    day_meals = DayMealSerializer(many=True, read_only=True)

    class Meta:
        model = WeeklyPlan
        fields = [
            "id",
            "week_start_date",
            "week_end_date",
            "target_calories",
            "plan_notes",
            "day_meals",
        ]
