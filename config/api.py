"""API-wide helpers shared across app viewsets."""
from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    """Turn a DB ``ON DELETE PROTECT`` violation into a clean 409 instead of an
    unhandled 500. Everything else falls through to DRF's default handler."""
    response = exception_handler(exc, context)
    if response is None and isinstance(exc, ProtectedError):
        count = len(exc.protected_objects)
        return Response(
            {
                "detail": (
                    f"Cannot delete: {count} related object(s) still reference "
                    "this record."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )
    return response
