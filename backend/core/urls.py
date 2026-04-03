from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/', include('users.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Meals
    path('api/meals/', include('meals.urls')),

    # Cheat Meals
    path('api/cheat-meals/', include('cheat_meals.urls')),

    # Training
    path('api/training/', include('training.urls')),

    # Grocery
    path('api/grocery/', include('grocery.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)