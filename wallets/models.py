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
    is_off_budget = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Account(models.Model):
    class Type(models.TextChoices):
        CHECKING = "checking"
        SAVINGS = "savings"
        INVESTMENT = "investment"
        LIABILITY = "liability"  # loans, mortgages, overdue bills — debt owed

    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=10, choices=Type.choices)
    # A liability starts negative (the amount owed) via opening_balance and climbs
    # toward zero as it is paid down (a transfer into it). Assets stay >= 0.
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    purpose = models.ForeignKey(
        Purpose,
        on_delete=models.PROTECT,
        related_name="accounts",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    @property
    def balance(self):
        """Current balance = opening balance + money in − money out. Computed
        from the transaction legs (reverse relations defined on Transaction).
        Negative for a liability with debt still outstanding."""
        incoming = self.incoming_transactions.aggregate(s=Sum("amount"))[
            "s"
        ] or Decimal("0")
        outgoing = self.outgoing_transactions.aggregate(s=Sum("amount"))[
            "s"
        ] or Decimal("0")
        return self.opening_balance + incoming - outgoing

    @property
    def is_liability(self):
        """Whether this account represents a debt (vs. an asset)."""
        return self.type == self.Type.LIABILITY
