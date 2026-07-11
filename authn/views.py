from django.conf import settings
from django.middleware.csrf import get_token
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .authentication import enforce_csrf
from .serializers import LoginSerializer, UserSerializer

ACCESS = settings.AUTH_COOKIE["ACCESS_NAME"]
REFRESH = settings.AUTH_COOKIE["REFRESH_NAME"]


def _set_cookie(response, name, value, max_age):
    cfg = settings.AUTH_COOKIE
    response.set_cookie(
        name,
        value,
        max_age=max_age,
        httponly=cfg["HTTPONLY"],
        secure=cfg["SECURE"],
        samesite=cfg["SAMESITE"],
        path=cfg["PATH"],
    )


def set_auth_cookies(response, access, refresh=None):
    _set_cookie(
        response,
        ACCESS,
        str(access),
        int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
    )
    if refresh is not None:
        _set_cookie(
            response,
            REFRESH,
            str(refresh),
            int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        )


def clear_auth_cookies(response):
    path = settings.AUTH_COOKIE["PATH"]
    response.delete_cookie(ACCESS, path=path)
    response.delete_cookie(REFRESH, path=path)


class CSRFView(APIView):
    """Bootstrap: sets the readable ``csrftoken`` cookie the client echoes back
    as the ``X-CSRFToken`` header on subsequent unsafe requests (login, etc.)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(request=None, responses=OpenApiResponse(description="CSRF cookie set"))
    def get(self, request):
        get_token(request)  # marks the csrftoken cookie for the response
        return Response({"detail": "CSRF cookie set."})


class LoginView(APIView):
    """Exchange username/password for access + refresh JWTs, delivered as
    httpOnly cookies (never exposed to JavaScript)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        request=LoginSerializer,
        responses=OpenApiResponse(description="Authenticated; tokens set as cookies"),
    )
    def post(self, request):
        enforce_csrf(request)
        # TokenObtainPairSerializer validates credentials and mints both tokens;
        # invalid credentials raise AuthenticationFailed (401).
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = serializer.validated_data

        response = Response({"detail": "Login successful."})
        set_auth_cookies(response, tokens["access"], tokens["refresh"])
        get_token(request)  # rotate the CSRF token on privilege change
        return response


class RefreshView(APIView):
    """Rotate the access token using the refresh-token cookie. With refresh
    rotation enabled, a fresh refresh token is issued too."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        request=None,
        responses=OpenApiResponse(description="New tokens set as cookies"),
    )
    def post(self, request):
        enforce_csrf(request)
        raw_refresh = request.COOKIES.get(REFRESH)
        if not raw_refresh:
            return Response(
                {"detail": "No refresh token cookie."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        # Invalid/expired/blacklisted refresh tokens raise InvalidToken (401).
        serializer = TokenRefreshSerializer(data={"refresh": raw_refresh})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        response = Response({"detail": "Token refreshed."})
        # `data` carries a rotated refresh token when ROTATE_REFRESH_TOKENS is on.
        set_auth_cookies(response, data["access"], data.get("refresh"))
        return response


class LogoutView(APIView):
    """Blacklist the refresh token and clear the auth cookies."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None, responses=OpenApiResponse(description="Logged out; cookies cleared")
    )
    def post(self, request):
        raw_refresh = request.COOKIES.get(REFRESH)
        if raw_refresh:
            try:
                RefreshToken(raw_refresh).blacklist()
            except TokenError:
                # Already expired/invalid — clearing the cookies is enough.
                pass

        response = Response({"detail": "Logout successful."})
        clear_auth_cookies(response)
        return response


class MeView(APIView):
    """Return the currently authenticated user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=UserSerializer)
    def get(self, request):
        return Response(UserSerializer(request.user).data)
