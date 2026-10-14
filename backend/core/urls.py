from django.http import JsonResponse
from django.views.defaults import page_not_found, server_error
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from rest_framework_simplejwt.views import TokenRefreshView
from core.media_serve import protected_media


def health(request):
    return JsonResponse({"status": "ok"})


def api_handler404(request, exception=None):
    if request.path.startswith("/api/"):
        return JsonResponse({"detail": "Not found"}, status=404)
    return page_not_found(request, exception)


def api_handler500(request):
    if request.path.startswith("/api/"):
        return JsonResponse({"detail": "Not found"}, status=500)
    return server_error(request)

urlpatterns = [
    path('health/', health),
    path(f"{settings.ADMIN_URL}/", admin.site.urls),
    # Auth
    path("api/auth/", include("users.urls")),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Meals
    path("api/meals/", include("meals.urls")),
    # Cheat Meals
    path("api/cheat-meals/", include("cheat_meals.urls")),
    # Training
    path("api/training/", include("training.urls")),
    # Grocery
    path("api/grocery/", include("grocery.urls")),
    # Authenticated media
    path("media/<path:file_path>", protected_media, name="protected_media"),
]

handler404 = "core.urls.api_handler404"
handler500 = "core.urls.api_handler500"
