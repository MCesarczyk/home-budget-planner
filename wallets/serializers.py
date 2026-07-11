from rest_framework import serializers

from .models import Account, Purpose


class PurposeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purpose
        fields = ["id", "name", "description", "target_amount"]


class AccountRefSerializer(serializers.ModelSerializer):
    """Lightweight account reference for nesting inside other payloads.

    Deliberately only `id` + `name` — never reuse `AccountSerializer` here: its
    `balance` field runs aggregate queries per account and would cause an N+1
    across a transaction list."""

    class Meta:
        model = Account
        fields = ["id", "name"]


class AccountSerializer(serializers.ModelSerializer):
    # Computed from the transaction legs (see Account.balance); never written.
    balance = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    # Derived from `type` — true for debts (loans, mortgages, overdue bills).
    is_liability = serializers.BooleanField(read_only=True)

    class Meta:
        model = Account
        fields = [
            "id",
            "name",
            "type",
            "opening_balance",
            "purpose",
            "is_active",
            "balance",
            "is_liability",
        ]
