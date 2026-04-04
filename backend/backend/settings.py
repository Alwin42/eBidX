from pathlib import Path
import os
from dotenv import load_dotenv
import dj_database_url  # DEPLOYMENT CHANGE: Added for Supabase

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# LOAD THE .env FILE
load_dotenv(BASE_DIR / ".env")

# Quick-start development settings - unsuitable for production
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-for-local")

# SECURITY WARNING: don't run with debug turned on in production!
# DEPLOYMENT CHANGE: Defaults to False if not set
DEBUG = os.getenv("DEBUG", "False") == "True"

# DEPLOYMENT CHANGE: Allows Render domains and local development
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

# STRIPE PAYMENT GATEWAY IMPLEMENTATION
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")

# ReCaptcha Secret Key
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")

# Application definition
INSTALLED_APPS = [
    "daphne",
    "cloudinary_storage", # DEPLOYMENT CHANGE: Must be before staticfiles/cloudinary
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "cloudinary",         # DEPLOYMENT CHANGE: Cloudinary integration
    "corsheaders",
    "rest_framework",
    "auctions",
    "rest_framework.authtoken",
    "channels",
    "dj_rest_auth",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware", # DEPLOYMENT CHANGE: Serves static files in prod
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# DEPLOYMENT CHANGE: If you deploy your React frontend to Vercel/Netlify, add that URL here
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    # "https://ebidx-frontend.vercel.app",  <-- Add your production frontend URL later
]
# Optionally, allow all origins while testing deployment:
CORS_ALLOW_ALL_ORIGINS = True if DEBUG else False

ROOT_URLCONF = "backend.urls"

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

WSGI_APPLICATION = "backend.wsgi.application"
ASGI_APPLICATION = "backend.asgi.application"

# NOTE: InMemory layer is okay for local or a single Render instance, 
# but if you scale to multiple servers, you will need to switch this to Redis.
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

# Database
# DEPLOYMENT CHANGE: Wired up for Supabase using the DATABASE_URL
DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL"),
        conn_max_age=0,
        conn_health_checks=True,
    )
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles" # DEPLOYMENT CHANGE: Required by Render/WhiteNoise

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# DEPLOYMENT CHANGE: Cloudinary Configuration for persistent image storage
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"