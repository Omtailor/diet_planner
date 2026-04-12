from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Adds security headers to every response.
    CSP restricts what scripts can run — primary XSS mitigation
    for JWT stored in localStorage.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # ── Content Security Policy ───────────────────────────────────────────
        # Locks down what scripts/resources the browser will execute.
        # Even if XSS is injected, CSP prevents exfiltrating localStorage tokens.
        frontend_origin = getattr(settings, '_FRONTEND_ORIGIN', '')

        csp_directives = [
            "default-src 'self'",
            "script-src 'self'",                    # No inline scripts, no eval
            "style-src 'self' 'unsafe-inline'",     # Allow inline styles (common in React)
            "img-src 'self' data: blob:",            # Allow data URIs for images
            "font-src 'self' data:",
            "connect-src 'self'" + (
                f" {frontend_origin}" if frontend_origin else ""
            ),                                      # API calls only to self + frontend
            "media-src 'self'",
            "object-src 'none'",                    # Block Flash/plugins entirely
            "base-uri 'self'",                      # Prevent base tag hijacking
            "frame-ancestors 'none'",               # Clickjacking — same as X-Frame-Options
            "form-action 'self'",                   # Forms can only submit to self
        ]

        response["Content-Security-Policy"] = "; ".join(csp_directives)

        # ── Additional headers ────────────────────────────────────────────────
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=()"
        )

        # Remove fingerprinting header
        response.headers.pop("X-Powered-By", None)
        response.headers.pop("Server", None)

        return response