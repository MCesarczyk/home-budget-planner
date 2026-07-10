from django.db.models import Q
from rest_framework import viewsets

from .models import Category, Subcategory, Transaction
from .serializers import (
    CategorySerializer,
    SubcategorySerializer,
    TransactionSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer


class SubcategoryViewSet(viewsets.ModelViewSet):
    queryset = Subcategory.objects.select_related("category").order_by(
        "category__name", "name"
    )
    serializer_class = SubcategorySerializer


class TransactionViewSet(viewsets.ModelViewSet):
    """Single transactions endpoint. The derived ``type`` field distinguishes
    income / expense / transfer. Supports these query filters:

    - ``type``            — income | expense | transfer
    - ``account``         — id appearing on either leg
    - ``source_account``  — id on the source leg
    - ``destination_account`` — id on the destination leg
    - ``subcategory``     — subcategory id
    - ``category``        — category id (via subcategory)
    - ``date_from`` / ``date_to`` — inclusive tx_date bounds (YYYY-MM-DD)
    """

    serializer_class = TransactionSerializer

    def get_queryset(self):
        qs = Transaction.objects.select_related(
            "source_account",
            "destination_account",
            "subcategory",
            "subcategory__category",
        ).order_by("-tx_date", "-id")

        params = self.request.query_params

        tx_type = params.get("type")
        if tx_type == "income":
            qs = qs.filter(source_account__isnull=True, destination_account__isnull=False)
        elif tx_type == "expense":
            qs = qs.filter(source_account__isnull=False, destination_account__isnull=True)
        elif tx_type == "transfer":
            qs = qs.filter(source_account__isnull=False, destination_account__isnull=False)

        if account := params.get("account"):
            qs = qs.filter(Q(source_account=account) | Q(destination_account=account))
        if source := params.get("source_account"):
            qs = qs.filter(source_account=source)
        if destination := params.get("destination_account"):
            qs = qs.filter(destination_account=destination)
        if subcategory := params.get("subcategory"):
            qs = qs.filter(subcategory=subcategory)
        if category := params.get("category"):
            qs = qs.filter(subcategory__category=category)
        if date_from := params.get("date_from"):
            qs = qs.filter(tx_date__gte=date_from)
        if date_to := params.get("date_to"):
            qs = qs.filter(tx_date__lte=date_to)

        return qs
