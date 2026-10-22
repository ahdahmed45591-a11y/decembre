import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.environ.get("DEBUG", "0") == "1"
# nginx envoie toujours "Host: backend" (voir nginx/default.conf) : le Host vu par
# Django ne depend plus du client. ALLOWED_HOSTS en plus pour un acces sans nginx.
ALLOWED_HOSTS = ["backend"] + [h for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h]

# Mode developpement local : faux depots sans Jeko + compte demo (voir seed).
# Jamais en production.
DEV_MODE = os.environ.get("DEV_MODE", "0") == "1"

# Un ordre est refuse si la derniere cotation du titre date de plus de N jours.
PRICE_MAX_AGE_DAYS = int(os.environ.get("PRICE_MAX_AGE_DAYS", 5))

# Aucune valeur par defaut hors DEBUG : un secret de repli finit toujours par
# devenir le secret de production. Le service refuse de demarrer sans.
JWT_SECRET = os.environ.get("JWT_SECRET") or ("dev-insecure-secret" if DEBUG else "")
if not JWT_SECRET:
    from django.core.exceptions import ImproperlyConfigured

    raise ImproperlyConfigured(
        "JWT_SECRET est absent. Renseignez-le dans .env.docker "
        "(demarrer_local.bat en genere un au premier lancement)."
    )
# ponytail: meme regle que JWT_SECRET -- l'ancien defaut en dur
# ("django-dev-key-change-me") partait tel quel en production. Se rabat sur
# JWT_SECRET, deja obligatoire et deja aleatoire, plutot que d'imposer une
# 2e variable a renseigner.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY") or JWT_SECRET
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/data/uploads")

# Charge les variables d'environnement locales (.env) s'il existe (ignore par git)
for _env in [BASE_DIR / ".env", BASE_DIR.parent / ".env", BASE_DIR.parent / ".env.docker"]:
    if _env.exists():
        try:
            with open(_env, encoding="utf-8") as _f:
                for _l in _f:
                    _l = _l.strip()
                    if _l and not _l.startswith("#") and "=" in _l:
                        _k, _v = _l.split("=", 1)
                        os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
        except OSError:
            pass

# Service d'email transactionnel (Gmail SMTP SSL ou surcharge via variables d'environnement).
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 465))
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "1") == "1"
EMAIL_USE_TLS = not EMAIL_USE_SSL
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "baoufinance@gmail.com")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", f"BAOU Finance <{EMAIL_HOST_USER}>")
EMAIL_TIMEOUT = 10

# URL publique du backend (ngrok ou domaine reel) utilisee pour construire le
# lien de confirmation dans l'email -- doit etre a jour dans .env.docker,
# sinon le lien pointe vers localhost et ne marche pas depuis le telephone.
BACKEND_PUBLIC_URL = os.environ.get("BACKEND_PUBLIC_URL", "http://localhost:3001")

# Depots mobiles : paiement en ligne Jeko Africa (voir api/jeko.py). Cles +
# storeId depuis https://cockpit.jeko.africa (Parametres > API & Webhooks).
# JEKO_WEBHOOK_SECRET signe les webhooks entrants (HMAC-SHA256) -- meme page,
# section webhook. Tant que ces valeurs sont vides, les depots echouent avec
# un message explicite (voir create_transaction) plutot que de planter.
JEKO_API_KEY = os.environ.get("JEKO_API_KEY", "")
JEKO_API_KEY_ID = os.environ.get("JEKO_API_KEY_ID", "")
JEKO_STORE_ID = os.environ.get("JEKO_STORE_ID", "")
JEKO_WEBHOOK_SECRET = os.environ.get("JEKO_WEBHOOK_SECRET", "")

# Notifications WhatsApp/SMS clients (voir api/zavu.py). Cle depuis
# https://dashboard.zavu.dev (Settings > API Keys). Vide = notifications
# silencieusement desactivees, comme EMAIL_HOST_PASSWORD plus haut.
ZAVU_API_KEY = os.environ.get("ZAVU_API_KEY", "")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "api",
]

MIDDLEWARE = [
    "config.settings.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "api.urls"
WSGI_APPLICATION = "config.wsgi.application"
APPEND_SLASH = False  # les clients appellent /api/stocks sans slash final

db_url = os.environ.get("DATABASE_URL")
if db_url:
    from urllib.parse import urlparse
    url = urlparse(db_url)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": url.path.lstrip("/"),
            "USER": url.username or "baou",
            "PASSWORD": url.password or "baou",
            "HOST": url.hostname or "localhost",
            "PORT": str(url.port or 5432),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "baou"),
            "USER": os.environ.get("POSTGRES_USER", "baou"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "baou"),
            "HOST": os.environ.get("POSTGRES_HOST", "db"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        }
    }

REST_FRAMEWORK = {
    # JSON uniquement. L'API navigable de DRF exige des templates et
    # staticfiles, et repondrait du HTML a un navigateur : 500 garanti.
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.AnonRateThrottle"],
    # "auth" : login / mot de passe oublie (voir AuthThrottle dans views.py).
    # 300/min laissait tout le loisir de brute-forcer un mot de passe.
    # "payments" : creation d'ordres et de depots (voir PaymentThrottle),
    # compte par COMPTE et non par IP. 40/min laisse passer un usage humain
    # meme nerveux et coupe court a un script qui inonde le carnet d'ordres.
    # ponytail: cale sur test_api.py, qui enchaine ~14 creations d'ordres en
    # quelques secondes sur un seul compte. A 20/min le test passait de
    # justesse et echouait s'il etait relance dans la meme minute.
    "DEFAULT_THROTTLE_RATES": {"anon": "300/min", "auth": "10/min", "register": "30/min", "payments": "40/min"},
    "UNAUTHENTICATED_USER": None,
}

DATA_UPLOAD_MAX_MEMORY_SIZE = 15 * 1024 * 1024  # documents KYC en base64
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
USE_TZ = True
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "UTC"


# Origines autorisees a appeler l'API depuis un navigateur (portail admin).
# Vide = toute origine acceptee, comportement d'origine, pratique en local.
# En production, lister le domaine de l'admin :
# CORS_ALLOWED_ORIGINS=https://admin.baoufinance.ci
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
]
if not DEBUG and not CORS_ALLOWED_ORIGINS:
    # ponytail: pas de hard-fail (l'app mobile n'a pas besoin de CORS, elle
    # n'envoie pas d'Origin) -- juste un avertissement visible dans les logs
    # tant que le domaine de l'admin n'est pas renseigne.
    print(
        "[config] ATTENTION : CORS_ALLOWED_ORIGINS vide en production -- "
        "toute origine est acceptee. Renseignez le domaine de l'admin.",
        flush=True,
    )


class CorsMiddleware:
    """Renvoie l'Origin appelante si elle est autorisee. L'app mobile n'est pas
    concernee (pas de navigateur, donc pas de CORS) et l'auth se fait par jeton
    Bearer, jamais par cookie : rien n'est envoye automatiquement par le
    navigateur, ce qui limite deja la portee d'une origine tierce."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            from django.http import HttpResponse

            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)
        origin = request.headers.get("Origin", "*")
        if CORS_ALLOWED_ORIGINS and origin not in CORS_ALLOWED_ORIGINS:
            origin = CORS_ALLOWED_ORIGINS[0]
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response["Access-Control-Max-Age"] = "86400"
        return response
