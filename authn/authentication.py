from django.conf import settings
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework import exceptions
from rest_framework.authentication import CSRFCheck
from rest_framework_simplejwt.authentication import JWTAuthentication

# Methods that don't mutate state and therefore don't need CSRF protection.
SAFE_METHODS = ("GET", "HEAD", "OPTIONS", "TRACE")


def enforce_csrf(request):
    """Run Django's double-submit CSRF check, mirroring DRF's
    SessionAuthentication. Cookie-stored JWTs are auto-attached by the browser —
    the exact condition CSRF defends against — so unsafe requests must carry a
    matching ``X-CSRFToken`` header."""

    def dummy_get_response(request):  # pragma: no cover
        return None

    check = CSRFCheck(dummy_get_response)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise exceptions.PermissionDenied(f"CSRF Failed: {reason}")


class CookieJWTAuthentication(JWTAuthentication):
    """Authenticate from the access-token httpOnly cookie instead of the
    ``Authorization`` header, enforcing CSRF on unsafe methods."""

    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE["ACCESS_NAME"])
        if not raw_token:
            # No cookie → unauthenticated; let permissions decide (401).
            return None

        validated_token = self.get_validated_token(raw_token)
        if request.method not in SAFE_METHODS:
            enforce_csrf(request)
        return self.get_user(validated_token), validated_token


class CookieJWTScheme(OpenApiAuthenticationExtension):
    """Document CookieJWTAuthentication as a cookie-based security scheme in the
    OpenAPI schema (and the Swagger UI)."""

    target_class = "authn.authentication.CookieJWTAuthentication"
    name = "cookieAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "cookie",
            "name": settings.AUTH_COOKIE["ACCESS_NAME"],
        }
