from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError


def validate_image_size(image):
    """Reject images larger than 5MB."""
    max_bytes = 5 * 1024 * 1024  # 5MB
    if image.size > max_bytes:
        raise ValidationError(f"Image too large. Maximum size is 5MB.")


class CheatMeal(models.Model):
    # ... everything unchanged ...
    ENTRY_METHOD_CHOICES = [
        ('image', 'Image Upload'),
        ('manual', 'Manual Text Entry'),
    ]

    SIZE_CHOICES = [
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cheat_meals')

    entry_method = models.CharField(max_length=10, choices=ENTRY_METHOD_CHOICES)
    logged_at = models.DateTimeField(auto_now_add=True)
    meal_date = models.DateField()

    food_name = models.CharField(max_length=200, blank=True)
    quantity_description = models.CharField(max_length=300, blank=True)

    ai_estimated_calories = models.FloatField(null=True, blank=True)
    user_edited_calories = models.FloatField(null=True, blank=True)

    @property
    def final_calories(self):
        return self.user_edited_calories if self.user_edited_calories is not None else self.ai_estimated_calories

    size = models.CharField(max_length=10, choices=SIZE_CHOICES, blank=True)

    ai_confidence = models.FloatField(null=True, blank=True)
    ai_raw_response = models.JSONField(null=True, blank=True)

    adjustment_days = models.PositiveIntegerField(default=0)
    adjustment_applied = models.BooleanField(default=False)

    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-logged_at']

    def __str__(self):
        return f"{self.user.username} - {self.food_name} ({self.meal_date})"

    def save(self, *args, **kwargs):
        cal = self.final_calories
        if cal is not None:
            if cal <= 300:
                self.size = 'small'
                self.adjustment_days = 2
            elif cal <= 700:
                self.size = 'medium'
                self.adjustment_days = 4
            else:
                self.size = 'large'
                self.adjustment_days = 7
        super().save(*args, **kwargs)


class CheatMealImage(models.Model):
    cheat_meal = models.ForeignKey(
        CheatMeal, on_delete=models.CASCADE, related_name='images'
    )
    # ✅ Added: extension allowlist + 5MB size cap
    image = models.ImageField(
        upload_to='cheat_meals/%Y/%m/%d/',
        validators=[
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp']),
            validate_image_size,
        ],
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.cheat_meal}"