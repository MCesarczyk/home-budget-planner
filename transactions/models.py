from django.db import models


class Category(models.Model):
    class Kind(models.TextChoices):
        INCOME = "income"
        EXPENSE = "expense"

    name = models.CharField(max_length=100, unique=True)
    kind = models.CharField(max_length=7, choices=Kind.choices)


class Subcategory(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="subcategories"
    )
    name = models.CharField(max_length=100)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["category", "name"], name="uq_subcategory_per_category"
            )
        ]


class Transaction(models.Model):
    subcategory = models.ForeignKey(
        Subcategory, on_delete=models.PROTECT, related_name="transactions"
    )
    tx_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
