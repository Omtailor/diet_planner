from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import UserProfile, WeightLog
from .serializers import UserProfileSerializer, RegisterSerializer, LoginSerializer
from meals.meal_generator import MealPlanGenerator
import logging

logger = logging.getLogger(__name__)


def get_tokens_for_user(user):
    """Generate JWT access + refresh tokens for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response(
                {
                    "message": "Account created successfully",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                    **tokens,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data["username"],
                password=serializer.validated_data["password"],
            )
            if user:
                tokens = get_tokens_for_user(user)
                # Check if onboarding is complete
                has_profile = UserProfile.objects.filter(user=user).exists()
                return Response(
                    {
                        "message": "Login successful",
                        "user": {
                            "id": user.id,
                            "username": user.username,
                            "email": user.email,
                        },
                        "onboarding_complete": has_profile,
                        **tokens,
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(
                {"error": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Prevent duplicate onboarding
        if UserProfile.objects.filter(user=request.user).exists():
            return Response(
                {
                    "error": "Profile already exists. Use PATCH /api/auth/profile/ to update."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UserProfileSerializer(data=request.data)
        if serializer.is_valid():
            profile = serializer.save(user=request.user)

            # Log initial weight
            if profile.weight_kg:
                WeightLog.objects.create(user=request.user, weight_kg=profile.weight_kg)

            # ── AUTO-GENERATE MEAL PLAN ──────────────────────
            try:
                generator = MealPlanGenerator(profile)
                plan = generator.generate()
                plan_generated = plan is not None

                try:
                    from grocery.grocery_generator import generate_grocery_list

                    generate_grocery_list(profile.user)
                except Exception as e:
                    logger.warning(f"[Onboarding] Grocery list generation failed: {e}")

            except Exception as e:
                logger.warning(f"[Onboarding] Meal plan generation failed: {e}")
                plan_generated = False
            # ────────────────────────────────────────────────

            return Response(
                {
                    "message": "Profile setup complete",
                    "profile": serializer.data,
                    "onboarding_complete": True,
                    "meal_plan_generated": plan_generated,  # ← tells frontend if plan is ready
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user profile"""
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response(
                {
                    **serializer.data,
                    "bmi": profile.bmi,
                    "username": request.user.username,
                    "email": request.user.email,
                }
            )
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Profile not found. Please complete onboarding."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def patch(self, request):
        """Partial update of profile"""
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                updated = serializer.save()

                # Log new weight if weight was updated
                if "weight_kg" in request.data:
                    WeightLog.objects.create(
                        user=request.user, weight_kg=updated.weight_kg
                    )

                return Response(
                    {
                        "message": "Profile updated successfully",
                        "profile": serializer.data,
                        "bmi": updated.bmi,
                    }
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND
            )
