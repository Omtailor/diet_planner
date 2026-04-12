from pathlib import Path
from dotenv import load_dotenv
import os
from datetime import timedelta

load_dotenv()

# ── Core ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set. Refusing to start.")

# ── Environment flag ──────────────────────────────────────────────────────────
# Set DJANGO_ENV=production in your Render environment variables.
# Locally it defaults to "development" so DEBUG stays True.
DJANGO_ENV = os.getenv("DJANGO_ENV", "development")
IS_PROD = DJANGO_ENV == "production"

DEBUG = not IS_PROD

# ── Hosts ─────────────────────────────────────────────────────────────────────
# Add your Render backend URL to .env as:
# ALLOWED_HOSTS=your-backend.onrender.com,localhost,127.0.0.1
_allowed = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")
ALLOWED_HOSTS = [h.strip() for h in _allowed.split(",") if h.strip()]

# ── Installed Apps ────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",  # ← Step 3: JWT blacklist
    "corsheaders",
    # Local apps
    "users",
    "meals",
    "cheat_meals",
    "grocery",
    "training",

]

# ── DRF ───────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
}

# ── JWT — Step 3 ──────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=6),   # ← was 1 day, reduced
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,              # ← was False, now True
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ── CORS ──────────────────────────────────────────────────────────────────────
# Add your Vercel frontend URL to .env as:
# CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:5173
_cors = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
)
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]

_FRONTEND_ORIGIN = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")[0].strip()

# ── HTTPS Security Headers (production only) ──────────────────────────────────
if IS_PROD:
    SECURE_HSTS_SECONDS = 31536000           # 1 year HSTS
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True               # Force HTTPS
    SESSION_COOKIE_SECURE = True             # Cookie only over HTTPS
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

    # Add your Vercel frontend URL to .env as CSRF_TRUSTED_ORIGINS
    # CSRF_TRUSTED_ORIGINS=https://your-app.vercel.app
    _csrf = os.getenv("CSRF_TRUSTED_ORIGINS", "")
    if _csrf:
        CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf.split(",") if o.strip()]

# ── Middleware ────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   
    "django.middleware.security.SecurityMiddleware",
    "core.middleware.SecurityHeadersMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

# ── Database ──────────────────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT"),
        "CONN_MAX_AGE": 60,
    }
}

# ── Password Validation ───────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── Internationalisation ──────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ── Static & Media ────────────────────────────────────────────────────────────
STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

ADMIN_URL = os.getenv("DJANGO_ADMIN_URL", "admin")  # falls back to /admin/ locally