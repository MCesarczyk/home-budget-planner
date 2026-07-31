from django.utils.dateparse import parse_date
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets

from .models import BudgetPlan
from .serializers import BudgetPlanReadSerializer, BudgetPlanWriteSerializer


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter(
                "month",
                OpenApiTypes.DATE,
                description="Filter to the plan for this month (any day in the "
                "month; matched against its first day).",
            ),
        ]
    ),
    # Writes accept subcategory ids but respond with the nested read shape.
    create=extend_schema(responses=BudgetPlanReadSerializer),
    update=extend_schema(responses=BudgetPlanReadSerializer),
    partial_update=extend_schema(responses=BudgetPlanReadSerializer),
)
class BudgetPlanViewSet(viewsets.ModelViewSet):
    """Monthly budget plans. A plan carries one line per subcategory; reads
    expand each subcategory (and its category), writes set them by id and
    replace the plan's items."""

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return BudgetPlanReadSerializer
        return BudgetPlanWriteSerializer

    def get_queryset(self):
        qs = BudgetPlan.objects.prefetch_related(
            "items__subcategory__category"
        ).order_by("-month")
        if raw := self.request.query_params.get("month"):
            # Accept a full date (YYYY-MM-DD) or a bare month (YYYY-MM); match on
            # the year+month so any day in the month finds that month's plan.
            month = parse_date(raw) or parse_date(f"{raw}-01")
            if month:
                qs = qs.filter(month__year=month.year, month__month=month.month)
        return qs
