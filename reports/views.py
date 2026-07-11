from decimal import Decimal

from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth
from django.utils.dateparse import parse_date
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from transactions.models import Transaction
from wallets.models import Account, Purpose

from .serializers import (
    CashflowReportSerializer,
    NetWorthSerializer,
    PurposesReportSerializer,
    SpendingReportSerializer,
)

ZERO = Decimal("0")

# Leg-shape predicates (see schema_design.md — type is derived from the legs).
_INCOME = Q(source_account__isnull=True, destination_account__isnull=False)
_EXPENSE = Q(source_account__isnull=False, destination_account__isnull=True)
_TRANSFER = Q(source_account__isnull=False, destination_account__isnull=False)

_DATE_PARAMS = [
    OpenApiParameter("date_from", OpenApiTypes.DATE, description="Inclusive lower bound on tx_date."),
    OpenApiParameter("date_to", OpenApiTypes.DATE, description="Inclusive upper bound on tx_date."),
]


def account_balances():
    """Return {account_id: balance} in a constant number of queries (no N+1).

    balance = opening_balance + Σ(incoming) − Σ(outgoing), matching
    Account.balance but computed in bulk."""
    incoming = {
        r["destination_account"]: r["s"]
        for r in Transaction.objects.filter(destination_account__isnull=False)
        .values("destination_account")
        .annotate(s=Sum("amount"))
    }
    outgoing = {
        r["source_account"]: r["s"]
        for r in Transaction.objects.filter(source_account__isnull=False)
        .values("source_account")
        .annotate(s=Sum("amount"))
    }
    return {
        acc.id: acc.opening_balance + incoming.get(acc.id, ZERO) - outgoing.get(acc.id, ZERO)
        for acc in Account.objects.all()
    }


def _date_bounds(request):
    return (
        parse_date(request.query_params.get("date_from") or ""),
        parse_date(request.query_params.get("date_to") or ""),
    )


class NetWorthView(APIView):
    """Per-account balances and total net worth."""

    @extend_schema(responses=NetWorthSerializer)
    def get(self, request):
        balances = account_balances()
        accounts = [
            {"id": a.id, "name": a.name, "type": a.type, "balance": balances.get(a.id, ZERO)}
            for a in Account.objects.all().order_by("name")
        ]
        net_worth = sum((a["balance"] for a in accounts), ZERO)
        return Response(NetWorthSerializer({"accounts": accounts, "net_worth": net_worth}).data)


class SpendingView(APIView):
    """Expenses grouped by category (with subcategory breakdown). Transfers and
    income are excluded — this is expense-only."""

    @extend_schema(parameters=_DATE_PARAMS, responses=SpendingReportSerializer)
    def get(self, request):
        date_from, date_to = _date_bounds(request)
        qs = Transaction.objects.filter(_EXPENSE, subcategory__isnull=False)
        if date_from:
            qs = qs.filter(tx_date__gte=date_from)
        if date_to:
            qs = qs.filter(tx_date__lte=date_to)

        rows = (
            qs.values(
                "subcategory__category__id",
                "subcategory__category__name",
                "subcategory__category__kind",
                "subcategory__id",
                "subcategory__name",
            )
            .annotate(total=Sum("amount"))
            .order_by("subcategory__category__name", "subcategory__name")
        )

        categories = {}
        for r in rows:
            cid = r["subcategory__category__id"]
            cat = categories.setdefault(
                cid,
                {
                    "id": cid,
                    "name": r["subcategory__category__name"],
                    "kind": r["subcategory__category__kind"],
                    "total": ZERO,
                    "subcategories": [],
                },
            )
            cat["subcategories"].append(
                {"id": r["subcategory__id"], "name": r["subcategory__name"], "total": r["total"]}
            )
            cat["total"] += r["total"]

        category_list = list(categories.values())
        total = sum((c["total"] for c in category_list), ZERO)
        data = {
            "date_from": date_from,
            "date_to": date_to,
            "total": total,
            "categories": category_list,
        }
        return Response(SpendingReportSerializer(data).data)


class CashflowView(APIView):
    """Monthly income, expense, and net. Transfers are excluded (internal moves
    that net to zero)."""

    @extend_schema(parameters=_DATE_PARAMS, responses=CashflowReportSerializer)
    def get(self, request):
        date_from, date_to = _date_bounds(request)
        qs = Transaction.objects.exclude(_TRANSFER)
        if date_from:
            qs = qs.filter(tx_date__gte=date_from)
        if date_to:
            qs = qs.filter(tx_date__lte=date_to)

        rows = (
            qs.annotate(month=TruncMonth("tx_date"))
            .values("month")
            .annotate(income=Sum("amount", filter=_INCOME), expense=Sum("amount", filter=_EXPENSE))
            .order_by("month")
        )

        months = []
        tot_income = tot_expense = ZERO
        for r in rows:
            income = r["income"] or ZERO
            expense = r["expense"] or ZERO
            tot_income += income
            tot_expense += expense
            months.append(
                {
                    "month": r["month"].strftime("%Y-%m"),
                    "income": income,
                    "expense": expense,
                    "net": income - expense,
                }
            )

        data = {
            "date_from": date_from,
            "date_to": date_to,
            "months": months,
            "totals": {
                "income": tot_income,
                "expense": tot_expense,
                "net": tot_income - tot_expense,
            },
        }
        return Response(CashflowReportSerializer(data).data)


class PurposesView(APIView):
    """Per purpose: earmarked total (Σ balances of its accounts) vs target."""

    @extend_schema(responses=PurposesReportSerializer)
    def get(self, request):
        balances = account_balances()
        purposes = []
        for p in Purpose.objects.all().order_by("name").prefetch_related("accounts"):
            accounts = [
                {"id": a.id, "name": a.name, "balance": balances.get(a.id, ZERO)}
                for a in p.accounts.all()
            ]
            current = sum((a["balance"] for a in accounts), ZERO)
            progress = round(float(current / p.target_amount), 4) if p.target_amount else None
            purposes.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "target_amount": p.target_amount,
                    "current_amount": current,
                    "progress": progress,
                    "accounts": accounts,
                }
            )
        return Response(PurposesReportSerializer({"purposes": purposes}).data)
