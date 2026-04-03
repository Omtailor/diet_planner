from django.urls import path
from .views import RegisterView, LoginView, OnboardingView, ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('onboarding/', OnboardingView.as_view(), name='onboarding'),
    path('profile/', ProfileView.as_view(), name='profile'),
]