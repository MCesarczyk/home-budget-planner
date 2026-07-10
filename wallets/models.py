from django.db import models


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
