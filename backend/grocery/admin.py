from django.contrib import admin
from .models import GroceryList, GroceryItem

class GroceryItemInline(admin.TabularInline):
    model = GroceryItem
    extra = 1

@admin.register(GroceryList)
class GroceryListAdmin(admin.ModelAdmin):
    list_display = ['user', 'weekly_plan', 'updated_at']
    inlines = [GroceryItemInline]