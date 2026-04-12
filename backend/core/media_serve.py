import os
import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated


def _get_jwt_user(request):
    """
    Manually run JWT authentication so we can use it inside
    a plain Django view (needed to support ?token= query param
    fallback for direct browser media requests).
    """
    authenticator = JWTAuthentication()
    try:
        result = authenticator.authenticate(request)
        if result is None:
            return None
        return result[0]   # (user, token) tuple
    except (AuthenticationFailed, NotAuthenticated):
        return None


def protected_media(request, file_path):
    """
    GET /media/<file_path>
    Requires valid JWT in Authorization: Bearer <token> header.
    Returns the file if the authenticated user owns it, 403 otherwise.
    """
    # ── 1. Authenticate ───────────────────────────────────────────────────────
    user = _get_jwt_user(request)
    if user is None or not user.is_authenticated:
        from django.http import JsonResponse
        return JsonResponse({'detail': 'Authentication required.'}, status=401)

    # ── 2. Resolve and validate path (prevent directory traversal) ────────────
    media_root = Path(settings.MEDIA_ROOT).resolve()
    requested   = (media_root / file_path).resolve()

    # Ensure the resolved path is still inside MEDIA_ROOT
    if not str(requested).startswith(str(media_root)):
        from django.http import JsonResponse
        return JsonResponse({'detail': 'Invalid path.'}, status=400)

    if not requested.exists() or not requested.is_file():
        raise Http404

    # ── 3. Ownership check — cheat meal images only ───────────────────────────
    # Path pattern: cheat_meals/<year>/<month>/<day>/<filename>
    # We verify the CheatMealImage belongs to the requesting user.
    parts = Path(file_path).parts
    if parts and parts[0] == 'cheat_meals':
        from cheat_meals.models import CheatMealImage
        owns = CheatMealImage.objects.filter(
            image=file_path,
            cheat_meal__user=user,
        ).exists()
        if not owns:
            from django.http import JsonResponse
            return JsonResponse({'detail': 'Forbidden.'}, status=403)

    # ── 4. Serve file ─────────────────────────────────────────────────────────
    content_type, _ = mimetypes.guess_type(str(requested))
    content_type = content_type or 'application/octet-stream'

    response = FileResponse(
        open(requested, 'rb'),
        content_type=content_type,
    )
    # Prevent browser caching of private media
    response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
    response['X-Content-Type-Options'] = 'nosniff'
    return response