from django.db import models
from django.db.models import F, Q

# A transaction is a transfer exactly when both account legs are set.
_TRANSFER = Q(source_account__isnull=False) & Q(destination_account__isnull=False)


class Category(models.Model):
    class Kind(models.TextChoices):
        INCOME = "income"
        EXPENSE = "expense"

    name = models.CharField(max_length=100, unique=True)
    kind = models.CharField(max_length=7, choices=Kind.choices)

    class Meta:
        verbose_name_plural = "categories"


class Subcategory(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="subcategories"
    )
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "subcategories"
        constraints = [
            models.UniqueConstraint(
                fields=["category", "name"], name="uq_subcategory_per_category"
            )
        ]


class Transaction(models.Model):
    """A money movement. Its type is derived from which account legs are set:
    income (destination only), expense (source only), transfer (both)."""

    source_account = models.ForeignKey(
        "wallets.Account",
        on_delete=models.PROTECT,
        related_name="outgoing_transactions",
        null=True,
        blank=True,
    )
    destination_account = models.ForeignKey(
        "wallets.Account",
        on_delete=models.PROTECT,
        related_name="incoming_transactions",
        null=True,
        blank=True,
    )
    subcategory = models.ForeignKey(
        Subcategory,
        on_delete=models.PROTECT,
        related_name="transactions",
        null=True,
        blank=True,
    )
    tx_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        constraints = [
            models.CheckConstraint(
                name="tx_at_least_one_account",
                condition=Q(source_account__isnull=False)
                | Q(destination_account__isnull=False),
            ),
            models.CheckConstraint(
                name="tx_no_self_transfer",
                condition=~Q(source_account=F("destination_account")),
            ),
            models.CheckConstraint(
                name="tx_amount_positive",
                condition=Q(amount__gt=0),
            ),
            # subcategory is set iff the transaction is NOT a transfer (a transfer
            # is the only shape with both account legs set).
            models.CheckConstraint(
                name="tx_subcategory_iff_not_transfer",
                condition=(_TRANSFER & Q(subcategory__isnull=True))
                | (~_TRANSFER & Q(subcategory__isnull=False)),
            ),
        ]
