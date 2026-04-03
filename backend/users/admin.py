from django.contrib import admin
from .models import UserProfile, WeightLog

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'age', 'goal', 'diet_preference', 'weight_kg', 'target_weight_kg', 'has_gym']
    search_fields = ['user__username', 'user__email']
    list_filter = ['goal', 'diet_preference', 'has_gym', 'is_fasting']

@admin.register(WeightLog)
class WeightLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'weight_kg', 'logged_at']
    search_fields = ['user__username']