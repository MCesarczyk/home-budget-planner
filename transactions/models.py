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
    # `default` covers ORM inserts (the in-memory instance gets "" when omitted);
    # `db_default` gives the column a real DB-level default so the raw-SQL seed
    # inserts, which omit this column, don't hit NOT NULL.
    comment = models.CharField(max_length=255, blank=True, default="", db_default="")

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
            # income/expense transactions must be categorized; transfers may
            # optionally carry a subcategory (e.g. a mortgage payment or a move
            # to a deposit/technical obligations account).
            models.CheckConstraint(
                name="tx_subcategory_required_for_non_transfer",
                condition=_TRANSFER | Q(subcategory__isnull=False),
            ),
        ]
