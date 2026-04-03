from rest_framework import serializers
from .models import GroceryList, GroceryItem


class GroceryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroceryItem
        fields = ['id', 'ingredient_name', 'quantity', 'unit', 'is_checked']


class GroceryListSerializer(serializers.ModelSerializer):
    items = GroceryItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    checked_items = serializers.SerializerMethodField()

    class Meta:
        model = GroceryList
        fields = [
            'id', 'weekly_plan', 'needs_refresh',
            'updated_at', 'total_items', 'checked_items', 'items',
        ]

    def get_total_items(self, obj):
        return obj.items.count()

    def get_checked_items(self, obj):
        return obj.items.filter(is_checked=True).count()