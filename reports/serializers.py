from rest_framework import serializers

# Report responses are computed dicts, not model instances. These serializers
# exist to format decimals as strings (consistent with the rest of the API) and
# to give drf-spectacular an accurate schema for the docs.

_MONEY = dict(max_digits=16, decimal_places=2)


# --- Net worth ---------------------------------------------------------------
class AccountBalanceSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    type = serializers.CharField()
    balance = serializers.DecimalField(**_MONEY)


class NetWorthSerializer(serializers.Serializer):
    accounts = AccountBalanceSerializer(many=True)
    net_worth = serializers.DecimalField(**_MONEY)


# --- Spending by category ----------------------------------------------------
class SpendingSubcategorySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    total = serializers.DecimalField(**_MONEY)


class SpendingCategorySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    kind = serializers.CharField()
    total = serializers.DecimalField(**_MONEY)
    subcategories = SpendingSubcategorySerializer(many=True)


class SpendingReportSerializer(serializers.Serializer):
    date_from = serializers.DateField(allow_null=True)
    date_to = serializers.DateField(allow_null=True)
    total = serializers.DecimalField(**_MONEY)
    categories = SpendingCategorySerializer(many=True)


# --- Cashflow (income vs expense over time) ----------------------------------
class CashflowMonthSerializer(serializers.Serializer):
    month = serializers.CharField()  # "YYYY-MM"
    income = serializers.DecimalField(**_MONEY)
    expense = serializers.DecimalField(**_MONEY)
    net = serializers.DecimalField(**_MONEY)


class CashflowTotalsSerializer(serializers.Serializer):
    income = serializers.DecimalField(**_MONEY)
    expense = serializers.DecimalField(**_MONEY)
    net = serializers.DecimalField(**_MONEY)


class CashflowReportSerializer(serializers.Serializer):
    date_from = serializers.DateField(allow_null=True)
    date_to = serializers.DateField(allow_null=True)
    months = CashflowMonthSerializer(many=True)
    totals = CashflowTotalsSerializer()


# --- Purpose progress --------------------------------------------------------
class PurposeAccountSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    balance = serializers.DecimalField(**_MONEY)


class PurposeProgressSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    target_amount = serializers.DecimalField(allow_null=True, **_MONEY)
    current_amount = serializers.DecimalField(**_MONEY)
    # current / target, or null when the purpose has no target.
    progress = serializers.FloatField(allow_null=True)
    accounts = PurposeAccountSerializer(many=True)


class PurposesReportSerializer(serializers.Serializer):
    purposes = PurposeProgressSerializer(many=True)
