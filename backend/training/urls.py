from django.urls import path
from .views import WeeklyTrainingView, DayTrainingView, GenerateTrainingPlanView

urlpatterns = [
    path('weekly/',              WeeklyTrainingView.as_view(),       name='training-weekly'),
    path('day/<str:training_date>/', DayTrainingView.as_view(),      name='training-day'),
    path('generate/',            GenerateTrainingPlanView.as_view(), name='training-generate'),
]