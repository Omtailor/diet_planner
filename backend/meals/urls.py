from django.urls import path
from meals.views import (
    WeeklyPlanView,
    DayMealView,
    GeneratePlanView,
    RegenerateDayView,
    GenerateNextWeekView,
    LatestPlanView,
    BatchDayMealView,
    AllDayMealsView,
)

urlpatterns = [
    path("weekly/", WeeklyPlanView.as_view(), name="weekly-plan"),
    path("day/<str:meal_date>/", DayMealView.as_view(), name="day-meal"),
    path("generate/", GeneratePlanView.as_view(), name="generate-plan"),
    path("regenerate-day/", RegenerateDayView.as_view(), name="regenerate-day"),
    path(
        "generate-next-week/", GenerateNextWeekView.as_view(), name="generate-next-week"
    ),
    path("latest/", LatestPlanView.as_view(), name="latest-plan"),
    path("batch/", BatchDayMealView.as_view(), name="batch-day-meal"),
    path("all-days/", AllDayMealsView.as_view(), name="all-day-meals"),
]
