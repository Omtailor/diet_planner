from django.db import models
from django.contrib.auth.models import User


class GroceryList(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grocery_lists')
    weekly_plan = models.OneToOneField(
        'meals.WeeklyPlan',
        on_delete=models.CASCADE,
        related_name='grocery_list'
    )
    needs_refresh = models.BooleanField(default=False)   # ← moved here
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Grocery List - {self.user.username} ({self.weekly_plan.week_start_date})"


class GroceryItem(models.Model):

    UNIT_CHOICES = [
        ('g', 'Grams'),
        ('kg', 'Kilograms'),
        ('ml', 'Milliliters'),
        ('l', 'Liters'),
        ('pcs', 'Pieces'),
        ('tbsp', 'Tablespoon'),
        ('tsp', 'Teaspoon'),
    ]

    grocery_list = models.ForeignKey(GroceryList, on_delete=models.CASCADE, related_name='items')
    ingredient_name = models.CharField(max_length=200)
    quantity = models.FloatField()
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='g')
    is_checked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.ingredient_name} - {self.quantity}{self.unit}"