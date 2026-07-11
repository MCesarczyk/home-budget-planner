from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets

from .models import Category, Subcategory, Transaction
from .serializers import (
    CategorySerializer,
    SubcategorySerializer,
    TransactionReadSerializer,
    TransactionWriteSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer


class SubcategoryViewSet(viewsets.ModelViewSet):
    queryset = Subcategory.objects.select_related("category").order_by(
        "category__name", "name"
    )
    serializer_class = SubcategorySerializer


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter(
                "type",
                OpenApiTypes.STR,
                enum=["income", "expense", "transfer"],
                description="Filter by derived transaction type.",
            ),
            OpenApiParameter(
                "account",
                OpenApiTypes.INT,
                description="Account id appearing on either leg.",
            ),
            OpenApiParameter("source_account", OpenApiTypes.INT),
            OpenApiParameter("destination_account", OpenApiTypes.INT),
            OpenApiParameter("subcategory", OpenApiTypes.INT),
            OpenApiParameter(
                "category",
                OpenApiTypes.INT,
                description="Category id (matched via subcategory).",
            ),
            OpenApiParameter(
                "date_from",
                OpenApiTypes.DATE,
                description="Inclusive lower bound on tx_date (YYYY-MM-DD).",
            ),
            OpenApiParameter(
                "date_to",
                OpenApiTypes.DATE,
                description="Inclusive upper bound on tx_date (YYYY-MM-DD).",
            ),
        ]
    ),
    # Writes accept ids but respond with the nested read shape (see
    # TransactionWriteSerializer.to_representation) — tell the schema that.
    create=extend_schema(responses=TransactionReadSerializer),
    update=extend_schema(responses=TransactionReadSerializer),
    partial_update=extend_schema(responses=TransactionReadSerializer),
)
class TransactionViewSet(viewsets.ModelViewSet):
    """Single transactions endpoint. The derived ``type`` field distinguishes
    income / expense / transfer. Reads expand related data (accounts, subcategory,
    category); writes set relations by id."""

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return TransactionReadSerializer
        return TransactionWriteSerializer

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
