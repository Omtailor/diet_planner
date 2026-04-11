from django.db import models
from django.contrib.auth.models import User


class FoodItem(models.Model):

    CATEGORY_CHOICES = [
        ("breakfast", "Breakfast"),
        ("lunch", "Lunch"),
        ("dinner", "Dinner"),
        ("snack", "Snack"),
    ]

    DIET_CHOICES = [
        ("jain", "Jain"),
        ("veg", "Vegetarian"),
        ("non_veg", "Non-Vegetarian"),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    diet_type = models.CharField(max_length=10, choices=DIET_CHOICES, default="veg")

    # Nutrition per serving
    calories = models.FloatField()
    protein_g = models.FloatField(default=0)
    carbs_g = models.FloatField(default=0)
    fats_g = models.FloatField(default=0)
    fiber_g = models.FloatField(default=0)
    serving_size_g = models.FloatField(default=100)
    serving_unit = models.CharField(max_length=50, default="serving")

    # Ingredients list — populated by Gemini during meal plan generation
    # Format: [{"name": "Paneer", "quantity": 200, "unit": "g"}, ...]
    ingredients = models.JSONField(default=list, blank=True)  # ← NEW

    is_fasting_friendly = models.BooleanField(default=False)
    is_jain_friendly = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.category})"


class WeeklyPlan(models.Model):

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="weekly_plans"
    )
    week_start_date = models.DateField()
    week_end_date = models.DateField()
    target_calories = models.FloatField()
    is_active = models.BooleanField(default=True)
    plan_notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-week_start_date"]
        unique_together = ["user", "week_start_date"]

    def __str__(self):
        return f"{self.user.username} - Week of {self.week_start_date}"


class DayMeal(models.Model):

    DAY_CHOICES = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    STATUS_CHOICES = [
        ("on_track", "On Track"),
        ("adjusted", "Adjusted"),
        ("regenerated", "Regenerated"),
    ]

    weekly_plan = models.ForeignKey(
        WeeklyPlan, on_delete=models.CASCADE, related_name="day_meals"
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="on_track")
    is_fasting_day = models.BooleanField(default=False)
    day_notes = models.TextField(blank=True, null=True)

    # Daily nutrition totals
    total_calories = models.FloatField(default=0)
    total_protein_g = models.FloatField(default=0)
    total_carbs_g = models.FloatField(default=0)
    total_fats_g = models.FloatField(default=0)

    class Meta:
        ordering = ["date"]
        unique_together = ["weekly_plan", "day_of_week"]

    def __str__(self):
        return f"{self.weekly_plan.user.username} - {self.get_day_of_week_display()} ({self.date})"

    def update_totals(self):
        """Recalculate and save daily macro totals from all meal slots."""
        slots = self.meal_slots.all()
        self.total_calories = round(sum(s.calories for s in slots), 1)
        self.total_protein_g = round(sum(s.protein_g for s in slots), 1)
        self.total_carbs_g = round(sum(s.carbs_g for s in slots), 1)
        self.total_fats_g = round(sum(s.fats_g for s in slots), 1)
        self.save()


class MealSlot(models.Model):

    SLOT_CHOICES = [
        ("breakfast", "Breakfast"),
        ("lunch", "Lunch"),
        ("dinner", "Dinner"),
    ]

    day_meal = models.ForeignKey(
        DayMeal, on_delete=models.CASCADE, related_name="meal_slots"
    )
    slot = models.CharField(max_length=15, choices=SLOT_CHOICES)
    food_item = models.ForeignKey(FoodItem, on_delete=models.SET_NULL, null=True)
    quantity_g = models.FloatField(default=100)

    # Calculated nutrition for this slot
    calories = models.FloatField(default=0)
    protein_g = models.FloatField(default=0)
    carbs_g = models.FloatField(default=0)
    fats_g = models.FloatField(default=0)

    class Meta:
        unique_together = ["day_meal", "slot"]

    def __str__(self):
        return f"{self.day_meal} - {self.slot}"

    def save(self, *args, **kwargs):
        # Macros are set directly from AI-generated values during meal plan creation.
        # Auto-scaling via ratio is intentionally disabled — quantity_g stores
        # serving count (e.g. 1.0 plate), not weight in grams.
        # If calories/macros are not explicitly set, fall back to food_item values.
        if self.food_item:
            if not self.calories:
                self.calories = round(self.food_item.calories, 1)
            if not self.protein_g:
                self.protein_g = round(self.food_item.protein_g, 1)
            if not self.carbs_g:
                self.carbs_g = round(self.food_item.carbs_g, 1)
            if not self.fats_g:
                self.fats_g = round(self.food_item.fats_g, 1)
        super().save(*args, **kwargs)
