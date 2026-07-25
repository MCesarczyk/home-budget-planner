from decimal import Decimal

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

    def validate(self, attrs):
        # Archive invariant: an account may only be archived (is_active False)
        # once its balance is zero. Archived accounts are excluded from the
        # net-worth report, so archiving one that still holds money would
        # silently erase that value — it must be transferred or withdrawn first.
        #
        # `balance` is not a stored column: it is computed on the fly as
        # opening_balance + Σincoming − Σoutgoing (see Account.balance), so this
        # cannot be a DB constraint. A brand-new account has no legs yet, so its
        # balance is just its opening_balance.
        #
        # Fires only on the True -> False transition (or an account created
        # already inactive); edits to an already-archived account are left alone.
        was_active = self.instance.is_active if self.instance else True
        will_be_active = attrs.get("is_active", was_active)
        if was_active and not will_be_active:
            balance = (
                self.instance.balance
                if self.instance
                else attrs.get("opening_balance", Decimal("0"))
            )
            if balance != 0:
                raise serializers.ValidationError(
                    {
                        "is_active": (
                            f"Account still holds {balance}; transfer or withdraw "
                            "the balance before archiving."
                        )
                    }
                )
        return attrs
