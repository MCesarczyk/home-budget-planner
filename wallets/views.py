from rest_framework import mixins, viewsets

from .models import Account, Purpose
from .serializers import AccountSerializer, PurposeSerializer


class PurposeViewSet(viewsets.ModelViewSet):
    queryset = Purpose.objects.all().order_by("name")
    serializer_class = PurposeSerializer


class AccountViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Accounts support list/retrieve/create/update but **not** delete: they are
    soft-archived by setting ``is_active=False`` (see docs/schema_design.md)."""

    queryset = Account.objects.select_related("purpose").order_by("name")
    serializer_class = AccountSerializer
