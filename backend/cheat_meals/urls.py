from django.urls import path
from .views import (
    ImageCheatMealView, ManualCheatMealView,
    ManualCheatMealFollowUpView, EditCheatMealCaloriesView,
    CheatMealHistoryView,
)

urlpatterns = [
    path('image/',           ImageCheatMealView.as_view(),          name='cheat-meal-image'),
    path('manual/',          ManualCheatMealView.as_view(),         name='cheat-meal-manual'),
    path('manual/followup/', ManualCheatMealFollowUpView.as_view(), name='cheat-meal-followup'),
    path('<int:pk>/edit/',   EditCheatMealCaloriesView.as_view(),   name='cheat-meal-edit'),
    path('history/',         CheatMealHistoryView.as_view(),        name='cheat-meal-history'),
]