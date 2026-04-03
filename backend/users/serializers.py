from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile, WeightLog


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserProfile
        exclude = ['user', 'created_at', 'updated_at']

    def validate(self, data):
        # If beverage is 'both', morning + evening must be specified
        beverage = data.get('beverage_habit', '')
        if beverage == 'both':
            if not data.get('morning_beverage'):
                raise serializers.ValidationError(
                    "morning_beverage is required when beverage_habit is 'both'."
                )
            if not data.get('evening_beverage'):
                raise serializers.ValidationError(
                    "evening_beverage is required when beverage_habit is 'both'."
                )

        # If fasting is True, fasting_days must be provided
        if data.get('is_fasting') and not data.get('fasting_days'):
            raise serializers.ValidationError(
                "fasting_days is required when is_fasting is True."
            )

        return data


class WeightLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightLog
        fields = ['id', 'weight_kg', 'logged_at']
        read_only_fields = ['logged_at']