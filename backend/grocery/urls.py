from django.urls import path
from .views import GroceryListView, CheckGroceryItemView, RefreshGroceryListView

urlpatterns = [
    path('',                 GroceryListView.as_view(),       name='grocery-list'),
    path('check/<int:pk>/',  CheckGroceryItemView.as_view(),  name='grocery-check'),
    path('refresh/',         RefreshGroceryListView.as_view(), name='grocery-refresh'),
]