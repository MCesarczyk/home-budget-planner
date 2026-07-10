from rest_framework import serializers

from .models import Category, Subcategory, Transaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "kind"]


class SubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = ["id", "category", "name"]


class TransactionSerializer(serializers.ModelSerializer):
    # Derived from which account legs are set — never stored (see model docstring).
    type = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "type",
            "tx_date",
            "amount",
            "source_account",
            "destination_account",
            "subcategory",
        ]

    def get_type(self, obj) -> str:
        if obj.source_account_id and obj.destination_account_id:
            return "transfer"
        return "income" if obj.destination_account_id else "expense"

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("amount must be positive.")
        return value

    def validate(self, attrs):
        """Enforce the shape rules that DB CHECK constraints and the cross-table
        category-compatibility rule (docs/schema_design.md) express, surfacing
        them as 400s rather than IntegrityErrors."""

        def resolved(field):
            # On partial updates, fall back to the current instance value.
            if field in attrs:
                return attrs[field]
            return getattr(self.instance, field, None)

        source = resolved("source_account")
        destination = resolved("destination_account")
        subcategory = resolved("subcategory")

        if source is None and destination is None:
            raise serializers.ValidationError(
                "A transaction must set source_account, destination_account, or both."
            )
        if source is not None and source == destination:
            raise serializers.ValidationError(
                "source_account and destination_account must differ (no self-transfer)."
            )

        is_transfer = source is not None and destination is not None
        if is_transfer:
            if subcategory is not None:
                raise serializers.ValidationError(
                    "A transfer (both account legs set) must not have a subcategory."
                )
            return attrs

        # Income (destination only) or expense (source only): subcategory required
        # and its category kind must match the transaction shape.
        if subcategory is None:
            raise serializers.ValidationError(
                "An income or expense transaction requires a subcategory."
            )
        shape = "income" if destination is not None else "expense"
        expected_kind = (
            Category.Kind.INCOME if shape == "income" else Category.Kind.EXPENSE
        )
        if subcategory.category.kind != expected_kind:
            raise serializers.ValidationError(
                f"An {shape} transaction requires a subcategory whose category kind "
                f"is '{expected_kind}', but '{subcategory.name}' belongs to a "
                f"'{subcategory.category.kind}' category."
            )
        return attrs
