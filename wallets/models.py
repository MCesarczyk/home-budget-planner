from decimal import Decimal

from django.db import models
from django.db.models import Sum


class Purpose(models.Model):
    """A savings goal an account can be earmarked toward (e.g. emergency fund,
    future home repair). A separate taxonomy from transaction categories."""

    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)
    target_amount = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )


class Account(models.Model):
    class Type(models.TextChoices):
        CHECKING = "checking"
        SAVINGS = "savings"
        INVESTMENT = "investment"

    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=10, choices=Type.choices)
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    purpose = models.ForeignKey(
        Purpose,
        on_delete=models.PROTECT,
        related_name="accounts",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)

    @property
    def balance(self):
        """Current balance = opening balance + money in − money out. Computed
        from the transaction legs (reverse relations defined on Transaction)."""
        incoming = self.incoming_transactions.aggregate(s=Sum("amount"))["s"] or Decimal("0")
        outgoing = self.outgoing_transactions.aggregate(s=Sum("amount"))["s"] or Decimal("0")
        return self.opening_balance + incoming - outgoing
