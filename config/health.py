"""Public health-check endpoint for uptime monitors / readiness probes."""
from django.db import connection
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()


class HealthView(APIView):
    """Liveness + readiness: the process is up and the database is reachable.
    Public and unauthenticated. Returns 200 ``{"status": "ok"}``, or 503 if the
    database can't be reached."""

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["health"],
        summary="Health check",
        description=(
            "Liveness + readiness probe. Public, no authentication. Returns 200 "
            '`{"status": "ok"}` when the process is up and the database is '
            "reachable; 503 otherwise."
        ),
        responses={200: HealthSerializer, 503: HealthSerializer},
        auth=[],
    )
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            return Response(
                {"status": "error", "database": "unreachable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"status": "ok"})
