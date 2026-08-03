from django.db import models
from django.db.models import Q


class BudgetPlan(models.Model):
    """A month's budget: planned amounts per subcategory. One plan per month,
    the month stored as its first day. Items are scoped to subcategories (the
    same grain as Transaction.subcategory) so plan-vs-actual is a direct join."""

    month = models.DateField(unique=True)

    class Meta:
        ordering = ["-month"]


class BudgetItem(models.Model):
    """One planned amount inside a plan, for a single subcategory. `amount` is a
    positive magnitude; the subcategory's category kind says whether it is
    planned income or expense."""

    budget_plan = models.ForeignKey(
        BudgetPlan, on_delete=models.CASCADE, related_name="items"
    )
    subcategory = models.ForeignKey(
        "transactions.Subcategory",
        on_delete=models.PROTECT,
        related_name="budget_items",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["budget_plan", "subcategory"],
                name="uq_budget_item_per_subcategory",
            ),
            models.CheckConstraint(
                name="budget_item_amount_positive",
                condition=Q(amount__gt=0),
            ),
        ]
