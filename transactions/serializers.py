from rest_framework import serializers

from wallets.serializers import AccountRefSerializer

from .models import Category, Subcategory, Transaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "kind"]


class SubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = ["id", "category", "name"]


class SubcategoryNestedSerializer(serializers.ModelSerializer):
    """Subcategory with its category expanded — for embedding in transactions."""

    category = CategorySerializer(read_only=True)

    class Meta:
        model = Subcategory
        fields = ["id", "name", "category"]


class TransactionReadSerializer(serializers.ModelSerializer):
    """GET representation: related data expanded so a client can render a
    transaction without extra lookups. All relations are already pulled by the
    viewset's `select_related`, so nesting adds no queries."""

    # Derived from which account legs are set — never stored (see model docstring).
    type = serializers.SerializerMethodField()
    source_account = AccountRefSerializer(read_only=True)
    destination_account = AccountRefSerializer(read_only=True)
    subcategory = SubcategoryNestedSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "type",
            "tx_date",
            "amount",
            "comment",
            "source_account",
            "destination_account",
            "subcategory",
        ]

    def get_type(self, obj) -> str:
        if obj.source_account_id and obj.destination_account_id:
            return "transfer"
        return "income" if obj.destination_account_id else "expense"


class TransactionWriteSerializer(serializers.ModelSerializer):
    """POST/PUT/PATCH representation: related data is set by id. Carries the
    cross-table validation; responses echo the nested read shape."""

    class Meta:
        model = Transaction
        fields = [
            "id",
            "tx_date",
            "amount",
            "comment",
            "source_account",
            "destination_account",
            "subcategory",
        ]

    def to_representation(self, instance):
        # Return the expanded shape after a write, matching GET.
        return TransactionReadSerializer(instance, context=self.context).data

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
