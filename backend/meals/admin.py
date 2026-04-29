from django.contrib import admin
from .models import FoodItem, WeeklyPlan, DayMeal, MealSlot


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "category",
        "diet_type",
        "calories",
        "protein_g",
        "carbs_g",
        "fats_g",
    ]
    search_fields = ["name"]
    list_filter = ["category", "diet_type", "is_fasting_friendly"]


@admin.register(WeeklyPlan)
class WeeklyPlanAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "week_start_date",
        "week_end_date",
        "target_calories",
        "is_active",
    ]
    list_filter = ["is_active"]


@admin.register(DayMeal)
class DayMealAdmin(admin.ModelAdmin):
    list_display = ["weekly_plan", "day_of_week", "date", "status", "total_calories"]
    list_filter = ["status"]


@admin.register(MealSlot)
class MealSlotAdmin(admin.ModelAdmin):
    list_display = ["day_meal", "slot", "food_item", "quantity_g", "calories"]
