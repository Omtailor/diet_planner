from rest_framework import serializers
from .models import Exercise, TrainingPlan, DayTraining


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = [
            "id",
            "name",
            "category",
            "equipment",
            "duration_minutes",
            "instructions",
            "calories_burned_per_min",
        ]


class DayTrainingSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, read_only=True)
    day_name = serializers.CharField(source="get_day_of_week_display", read_only=True)
    total_duration = serializers.SerializerMethodField()
    total_calories_burned = serializers.SerializerMethodField()

    class Meta:
        model = DayTraining
        fields = [
            "id",
            "day_of_week",
            "day_name",
            "date",
            "is_rest_day",
            "exercises",
            "total_duration",
            "total_calories_burned",
        ]

    def get_total_duration(self, obj):
        if obj.is_rest_day:
            return 0
        return sum(e.duration_minutes for e in obj.exercises.all())

    def get_total_calories_burned(self, obj):
        if obj.is_rest_day:
            return 0
        return round(
            sum(
                e.calories_burned_per_min * e.duration_minutes
                for e in obj.exercises.all()
            )
        )


class TrainingPlanSerializer(serializers.ModelSerializer):
    day_trainings = DayTrainingSerializer(many=True, read_only=True)

    class Meta:
        model = TrainingPlan
        fields = [
            "id",
            "week_start_date",
            "is_active",
            "created_at",
            "day_trainings",
        ]
