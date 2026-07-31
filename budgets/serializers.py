from decimal import Decimal

from django.db import transaction as db_transaction
from rest_framework import serializers

from transactions.models import Category
from transactions.serializers import SubcategoryNestedSerializer

from .models import BudgetItem, BudgetPlan

_MONEY = dict(max_digits=14, decimal_places=2)


class BudgetItemReadSerializer(serializers.ModelSerializer):
    """GET shape: subcategory expanded (with its category), matching how
    transactions nest their subcategory. Relations are prefetched by the viewset."""

    subcategory = SubcategoryNestedSerializer(read_only=True)

    class Meta:
        model = BudgetItem
        fields = ["id", "amount", "subcategory"]


class BudgetItemWriteSerializer(serializers.ModelSerializer):
    """Write shape for a single line: subcategory by id + amount."""

    class Meta:
        model = BudgetItem
        fields = ["subcategory", "amount"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("amount must be positive.")
        return value


class BudgetPlanReadSerializer(serializers.ModelSerializer):
    items = BudgetItemReadSerializer(many=True, read_only=True)
    # Planned totals split by kind — mixing income and expense magnitudes into a
    # single sum would be meaningless (see the income/expense discipline).
    planned_income = serializers.SerializerMethodField()
    planned_expense = serializers.SerializerMethodField()

    class Meta:
        model = BudgetPlan
        fields = ["id", "month", "planned_income", "planned_expense", "items"]

    def _sum(self, obj, kind):
        return sum(
            (
                i.amount
                for i in obj.items.all()
                if i.subcategory.category.kind == kind
            ),
            Decimal("0"),
        )

    def get_planned_income(self, obj) -> Decimal:
        return self._sum(obj, Category.Kind.INCOME)

    def get_planned_expense(self, obj) -> Decimal:
        return self._sum(obj, Category.Kind.EXPENSE)


class BudgetPlanWriteSerializer(serializers.ModelSerializer):
    """POST/PUT/PATCH: a plan is created or replaced together with its items in
    one payload. Responses echo the nested read shape."""

    items = BudgetItemWriteSerializer(many=True)

    class Meta:
        model = BudgetPlan
        fields = ["id", "month", "items"]

    def validate_month(self, value):
        # A plan is month-scoped; normalize any day to the first of the month so
        # the unique constraint treats "July" as one plan regardless of day.
        return value.replace(day=1)

    def validate(self, attrs):
        # Uniqueness must be checked on the normalized month, not the raw day the
        # default UniqueValidator saw — two different days in the same month are
        # the same plan.
        month = attrs.get("month")
        if month is not None:
            clash = BudgetPlan.objects.filter(month=month)
            if self.instance is not None:
                clash = clash.exclude(pk=self.instance.pk)
            if clash.exists():
                raise serializers.ValidationError(
                    {"month": f"A budget plan for {month:%Y-%m} already exists."}
                )
        return attrs

    def validate_items(self, value):
        seen = set()
        for item in value:
            sub = item["subcategory"]
            if sub.id in seen:
                raise serializers.ValidationError(
                    f"Subcategory '{sub.name}' appears more than once in the plan."
                )
            seen.add(sub.id)
        return value

    @db_transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items", [])
        plan = BudgetPlan.objects.create(**validated_data)
        BudgetItem.objects.bulk_create(
            BudgetItem(budget_plan=plan, **item) for item in items
        )
        return plan

    @db_transaction.atomic
    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        # Items omitted (partial update) -> left untouched; provided -> replaced
        # wholesale, the simplest consistent semantics for re-saving a month.
        if items is not None:
            instance.items.all().delete()
            BudgetItem.objects.bulk_create(
                BudgetItem(budget_plan=instance, **item) for item in items
            )
        return instance

    def to_representation(self, instance):
        return BudgetPlanReadSerializer(instance, context=self.context).data
