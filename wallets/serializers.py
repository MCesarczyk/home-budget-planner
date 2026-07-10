from rest_framework import serializers

from .models import Account, Purpose


class PurposeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purpose
        fields = ["id", "name", "description", "target_amount"]


class AccountSerializer(serializers.ModelSerializer):
    # Computed from the transaction legs (see Account.balance); never written.
    balance = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

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
        ]
