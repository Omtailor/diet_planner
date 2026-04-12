import os
import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated

# ── Explicitly allowlisted media prefixes ─────────────────────────────────────
# Only paths under these top-level folders will ever be served.
# Add a new entry here when you introduce a new upload type.
ALLOWED_MEDIA_PREFIXES = {
    "cheat_meals",   # CheatMealImage uploads
}


def _get_jwt_user(request):
    authenticator = JWTAuthentication()
    try:
        result = authenticator.authenticate(request)
        if result is None:
            return None
        return result[0]
    except (AuthenticationFailed, NotAuthenticated):
        return None


def protected_media(request, file_path):
    """
    GET /media/<file_path>
    Requires valid JWT. Only serves files under ALLOWED_MEDIA_PREFIXES.
    Enforces per-user ownership for known upload types.
    """
    # ── 1. Authenticate ───────────────────────────────────────────────────────
    user = _get_jwt_user(request)
    if user is None or not user.is_authenticated:
        return JsonResponse({'detail': 'Authentication required.'}, status=401)

    # ── 2. Check top-level prefix is in allowlist (default-deny) ─────────────
    parts = Path(file_path).parts
    if not parts or parts[0] not in ALLOWED_MEDIA_PREFIXES:
        # Unknown prefix — deny even for authenticated users
        return JsonResponse({'detail': 'Forbidden.'}, status=403)

    # ── 3. Resolve path and prevent directory traversal ───────────────────────
    media_root = Path(settings.MEDIA_ROOT).resolve()
    requested  = (media_root / file_path).resolve()

    if not str(requested).startswith(str(media_root) + os.sep):
        return JsonResponse({'detail': 'Invalid path.'}, status=400)

    if not requested.exists() or not requested.is_file():
        raise Http404

    # ── 4. Per-prefix ownership check ────────────────────────────────────────
    if parts[0] == "cheat_meals":
        from cheat_meals.models import CheatMealImage
        owns = CheatMealImage.objects.filter(
            image=file_path,
            cheat_meal__user=user,
        ).exists()
        if not owns:
            return JsonResponse({'detail': 'Forbidden.'}, status=403)

    # ── 5. Serve file ─────────────────────────────────────────────────────────
    content_type, _ = mimetypes.guess_type(str(requested))
    content_type = content_type or 'application/octet-stream'

    response = FileResponse(
        open(requested, 'rb'),
        content_type=content_type,
    )
    response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
    response['X-Content-Type-Options'] = 'nosniff'
    return response