from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):

    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
    ]

    GOAL_CHOICES = [
        ("muscle_building", "Muscle Building"),
        ("fat_loss", "Fat Loss"),
        ("weight_loss", "Weight Loss"),
        ("maintenance", "Maintenance"),
    ]

    DIET_CHOICES = [
        ("jain", "Jain"),
        ("veg", "Vegetarian"),
        ("non_veg", "Non-Vegetarian"),
    ]

    BEVERAGE_CHOICES = [
        ("none", "None"),
        ("tea", "Tea"),
        ("coffee", "Coffee"),
        ("both", "Both"),
    ]

    TEA_TYPE_CHOICES = [
        ("milk", "Milk Tea"),
        ("black", "Black Tea"),
        ("green", "Green Tea"),
    ]

    COFFEE_TYPE_CHOICES = [
        ("milk", "Milk Coffee"),
        ("black", "Black Coffee"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    # Basic Info
    gender = models.CharField(
        max_length=10, choices=GENDER_CHOICES, default="male"
    )  # ← ADDED
    city = models.CharField(max_length=100, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    target_weight_kg = models.FloatField(null=True, blank=True)

    # Health & Goal
    health_time_minutes = models.PositiveIntegerField(default=60)
    goal = models.CharField(max_length=20, choices=GOAL_CHOICES, default="maintenance")
    diet_preference = models.CharField(
        max_length=10, choices=DIET_CHOICES, default="veg"
    )

    # Beverage
    beverage_habit = models.CharField(
        max_length=10, choices=BEVERAGE_CHOICES, default="none"
    )
    tea_type = models.CharField(
        max_length=10, choices=TEA_TYPE_CHOICES, blank=True, null=True
    )
    coffee_type = models.CharField(
        max_length=10, choices=COFFEE_TYPE_CHOICES, blank=True, null=True
    )
    morning_beverage = models.CharField(max_length=10, blank=True, null=True)
    evening_beverage = models.CharField(max_length=10, blank=True, null=True)

    # Fasting
    is_fasting = models.BooleanField(default=False)
    fasting_days = models.CharField(max_length=100, blank=True, null=True)
    fasting_type = models.CharField(max_length=100, blank=True, null=True)

    # Gym
    has_gym = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    @property
    def bmi(self):
        if self.height_cm and self.weight_kg:
            height_m = self.height_cm / 100
            return round(self.weight_kg / (height_m**2), 1)
        return None


class WeightLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="weight_logs")
    weight_kg = models.FloatField()
    logged_at = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ["-logged_at"]

    def __str__(self):
        return f"{self.user.username} - {self.weight_kg}kg on {self.logged_at}"
