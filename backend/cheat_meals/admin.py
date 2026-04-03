from django.contrib import admin
from .models import CheatMeal, CheatMealImage

class CheatMealImageInline(admin.TabularInline):
    model = CheatMealImage
    extra = 1
    max_num = 2  # enforces 2-image limit in admin too

@admin.register(CheatMeal)
class CheatMealAdmin(admin.ModelAdmin):
    list_display = ['user', 'food_name', 'final_calories', 'size', 'entry_method', 'meal_date', 'adjustment_applied']
    list_filter = ['size', 'entry_method', 'adjustment_applied']
    search_fields = ['user__username', 'food_name']
    inlines = [CheatMealImageInline]