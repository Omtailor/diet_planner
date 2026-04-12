from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile, WeightLog


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    # ✅ REMOVED individual validate_username and validate_email methods
    # They revealed exactly which field already exists — enumeration risk

    def validate(self, data):
        """
        Validate uniqueness of username and email together.
        Returns the same generic error regardless of which field conflicts —
        prevents attackers from probing which usernames/emails are registered.
        """
        username = data.get("username", "")
        email = data.get("email", "")

        username_taken = User.objects.filter(username=username).exists()
        email_taken = User.objects.filter(email=email).exists()

        if username_taken or email_taken:
            raise serializers.ValidationError(
                "An account with these credentials already exists."
            )

        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserProfile
        exclude = ["user", "created_at", "updated_at"]

    def validate(self, data):
        # If beverage is 'both', morning + evening must be specified
        beverage = data.get("beverage_habit", "")
        if beverage == "both":
            if not data.get("morning_beverage"):
                raise serializers.ValidationError(
                    "morning_beverage is required when beverage_habit is 'both'."
                )
            if not data.get("evening_beverage"):
                raise serializers.ValidationError(
                    "evening_beverage is required when beverage_habit is 'both'."
                )

        # If fasting is True, fasting_days must be provided
        if data.get("is_fasting") and not data.get("fasting_days"):
            raise serializers.ValidationError(
                "fasting_days is required when is_fasting is True."
            )

        return data


class WeightLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightLog
        fields = ["id", "weight_kg", "logged_at"]
        read_only_fields = ["logged_at"]
