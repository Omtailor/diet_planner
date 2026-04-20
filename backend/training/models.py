from django.db import models
from django.contrib.auth.models import User


class Exercise(models.Model):
    """Master exercise database"""

    CATEGORY_CHOICES = [
        ("strength", "Strength"),
        ("cardio", "Cardio"),
        ("flexibility", "Flexibility"),
        ("bodyweight", "Bodyweight"),
    ]

    EQUIPMENT_CHOICES = [
        ("none", "No Equipment"),
        ("gym", "Gym Equipment"),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    equipment = models.CharField(
        max_length=10, choices=EQUIPMENT_CHOICES, default="none"
    )
    duration_minutes = models.PositiveIntegerField(default=20)
    instructions = models.TextField(blank=True)
    calories_burned_per_min = models.FloatField(default=5.0)
    sets = models.PositiveIntegerField(null=True, blank=True)
    reps = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.category})"


class TrainingPlan(models.Model):
    """7-day training plan per user per week"""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="training_plans"
    )
    week_start_date = models.DateField()
    week_end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-week_start_date"]
        unique_together = ["user", "week_start_date"]

    def __str__(self):
        return f"{self.user.username} - Training Week of {self.week_start_date}"


class DayTraining(models.Model):
    """Exercises assigned to a specific day inside a TrainingPlan"""

    DAY_CHOICES = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    training_plan = models.ForeignKey(
        TrainingPlan, on_delete=models.CASCADE, related_name="day_trainings"
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    date = models.DateField()
    exercises = models.ManyToManyField(Exercise, blank=True)
    is_rest_day = models.BooleanField(default=False)
    day_notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["date"]
        unique_together = ["training_plan", "day_of_week"]

    def __str__(self):
        return f"{self.training_plan.user.username} - {self.get_day_of_week_display()}"
