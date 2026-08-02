from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from django.utils.dateparse import parse_date
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from transactions.aggregation import off_budget_account_ids
from transactions.models import Transaction

from .models import BudgetPlan
from .serializers import (
    BudgetPlanProgressSerializer,
    BudgetPlanReadSerializer,
    BudgetPlanWriteSerializer,
)

ZERO = Decimal("0")


def _progress(planned, actual):
    """actual / planned, rounded; None when there is no plan to measure against."""
    return round(float(actual / planned), 4) if planned else None


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
    replace the plan's items. The ``progress`` routes add plan-vs-actual."""

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

    @extend_schema(responses=BudgetPlanProgressSerializer)
    @action(detail=True, methods=["get"])
    def progress(self, request, pk=None):
        """Realisation progress for one plan: each planned line next to the
        actual transactions for that subcategory in the plan's month."""
        return Response(BudgetPlanProgressSerializer(_build_progress(self.get_object())).data)

    @extend_schema(responses=BudgetPlanProgressSerializer)
    @action(detail=False, methods=["get"], url_path="current/progress")
    def current_progress(self, request):
        """Progress for the budget currently in effect: the plan for the current
        month, or the most recent prior month if the current month has no plan."""
        this_month = timezone.localdate().replace(day=1)
        plan = (
            BudgetPlan.objects.filter(month__lte=this_month)
            .prefetch_related("items__subcategory__category")
            .order_by("-month")
            .first()
        )
        if plan is None:
            raise NotFound("No budget plan is in effect.")
        return Response(BudgetPlanProgressSerializer(_build_progress(plan)).data)


def _build_progress(plan):
    """Join a plan's planned amounts to the actual transaction totals for its
    month, grouped into subcategories -> categories -> income/expense totals.

    Actuals are a single grouped aggregate; subcategories with spending but no
    plan line are included with planned=0 (unbudgeted spend). Two queries total.

    Money spent out of an off-budget account (an emergency-fund purpose-spend, or
    rolling a matured deposit into a new one) is excluded — it counted already
    when it was set aside. The contribution into the fund still counts here, as
    any categorised transfer does."""
    actual_rows = (
        Transaction.objects.filter(
            subcategory__isnull=False,
            tx_date__year=plan.month.year,
            tx_date__month=plan.month.month,
        )
        .exclude(source_account__in=off_budget_account_ids())
        .values(
            "subcategory__id",
            "subcategory__name",
            "subcategory__category__id",
            "subcategory__category__name",
            "subcategory__category__kind",
        )
        .annotate(actual=Sum("amount"))
    )

    # subcategory_id -> line dict. Seed from the plan, then fold in actuals.
    lines = {}
    for item in plan.items.select_related("subcategory__category").all():
        sub, cat = item.subcategory, item.subcategory.category
        lines[sub.id] = {
            "id": sub.id,
            "name": sub.name,
            "_cat": {"id": cat.id, "name": cat.name, "kind": cat.kind},
            "planned": item.amount,
            "actual": ZERO,
        }
    for r in actual_rows:
        sid = r["subcategory__id"]
        line = lines.get(sid)
        if line is None:
            line = lines[sid] = {
                "id": sid,
                "name": r["subcategory__name"],
                "_cat": {
                    "id": r["subcategory__category__id"],
                    "name": r["subcategory__category__name"],
                    "kind": r["subcategory__category__kind"],
                },
                "planned": ZERO,
                "actual": ZERO,
            }
        line["actual"] = r["actual"]

    categories = {}
    for line in lines.values():
        cat = line.pop("_cat")
        c = categories.setdefault(
            cat["id"],
            {**cat, "planned": ZERO, "actual": ZERO, "subcategories": []},
        )
        line["remaining"] = line["planned"] - line["actual"]
        line["progress"] = _progress(line["planned"], line["actual"])
        c["subcategories"].append(line)
        c["planned"] += line["planned"]
        c["actual"] += line["actual"]

    totals = {
        "income": {"planned": ZERO, "actual": ZERO},
        "expense": {"planned": ZERO, "actual": ZERO},
    }
    category_list = []
    for c in categories.values():
        c["subcategories"].sort(key=lambda x: x["name"])
        c["remaining"] = c["planned"] - c["actual"]
        c["progress"] = _progress(c["planned"], c["actual"])
        t = totals[c["kind"]]
        t["planned"] += c["planned"]
        t["actual"] += c["actual"]
        category_list.append(c)
    category_list.sort(key=lambda x: (x["kind"], x["name"]))

    for t in totals.values():
        t["remaining"] = t["planned"] - t["actual"]
        t["progress"] = _progress(t["planned"], t["actual"])

    return {
        "id": plan.id,
        "month": plan.month,
        "categories": category_list,
        "totals": totals,
    }
