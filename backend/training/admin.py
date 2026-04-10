from django.contrib import admin
from .models import Exercise, TrainingPlan, DayTraining


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "category",
        "equipment",
        "duration_minutes",
        "calories_burned_per_min",
    ]
    list_filter = ["category", "equipment"]
    search_fields = ["name"]


@admin.register(TrainingPlan)
class TrainingPlanAdmin(admin.ModelAdmin):
    list_display = ["user", "week_start_date", "is_active"]


@admin.register(DayTraining)
class DayTrainingAdmin(admin.ModelAdmin):
    list_display = ["training_plan", "day_of_week", "date", "is_rest_day"]
    list_filter = ["is_rest_day"]
