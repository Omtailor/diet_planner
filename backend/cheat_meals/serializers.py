from rest_framework import serializers
from .models import CheatMeal, CheatMealImage


class CheatMealImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheatMealImage
        fields = ["id", "image", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class CheatMealSerializer(serializers.ModelSerializer):
    images = CheatMealImageSerializer(many=True, read_only=True)
    final_calories = serializers.ReadOnlyField()
    size_label = serializers.SerializerMethodField()

    class Meta:
        model = CheatMeal
        fields = [
            "id",
            "entry_method",
            "food_name",
            "quantity_description",
            "ai_estimated_calories",
            "user_edited_calories",
            "final_calories",
            "ai_confidence",
            "size",
            "adjustment_days",
            "ai_raw_response",
            "notes",
            "images",
            "size_label",
            "logged_at",
        ]
        read_only_fields = [
            "id",
            "ai_estimated_calories",
            "ai_confidence",
            "size",
            "adjustment_days",
            "ai_raw_response",
            "logged_at",
        ]

    def get_size_label(self, obj):
        labels = {"small": "≤300 kcal", "medium": "300–700 kcal", "large": ">700 kcal"}
        return labels.get(obj.size, obj.size)


class CheatMealCreateSerializer(serializers.Serializer):
    """Used for image-based cheat meal creation (multipart/form-data)."""

    images = serializers.ListField(
        child=serializers.ImageField(),
        max_length=2,
        required=False,
    )
    user_edited_calories = serializers.IntegerField(required=False, min_value=0)
    notes = serializers.CharField(required=False, allow_blank=True)


class ManualCheatMealSerializer(serializers.Serializer):
    """Used for text-based cheat meal creation."""

    manual_description = serializers.CharField(max_length=500)
    user_edited_calories = serializers.IntegerField(required=False, min_value=0)
    notes = serializers.CharField(required=False, allow_blank=True)


class AskMoreSerializer(serializers.Serializer):
    """AI follow-up Q&A for manual entry."""

    cheat_meal_id = serializers.IntegerField()
    answer = serializers.CharField(max_length=500)
