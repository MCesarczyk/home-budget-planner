from decimal import Decimal

from django.db import migrations
from django.db.models import Q

# Sample liability activity (v3), spanning the same 2023 window as the base seed.
# Principal paydowns are TRANSFERS (cash account -> liability, net-worth neutral);
# interest is an EXPENSE from the cash account under the seeded Interest category.

# (tx_date, source_name, destination_name, amount)
PAYDOWNS = [
    ("2023-08-01", "Main Checking", "Home Mortgage", "800.00"),
    ("2023-10-01", "Main Checking", "Home Mortgage", "800.00"),
    ("2023-12-01", "Main Checking", "Home Mortgage", "800.00"),
    ("2023-11-05", "Main Checking", "Credit Card", "500.00"),
]

# (tx_date, source_name, subcategory_name, amount)
INTEREST = [
    ("2023-08-01", "Main Checking", "Mortgage Interest", "950.00"),
    ("2023-10-01", "Main Checking", "Mortgage Interest", "945.00"),
    ("2023-12-01", "Main Checking", "Mortgage Interest", "940.00"),
    ("2023-09-15", "Main Checking", "Credit Card Interest", "42.00"),
]


def seed(apps, schema_editor):
    Account = apps.get_model("wallets", "Account")
    Subcategory = apps.get_model("transactions", "Subcategory")
    Transaction = apps.get_model("transactions", "Transaction")

    accounts = {a.name: a for a in Account.objects.all()}
    for tx_date, source, destination, amount in PAYDOWNS:
        Transaction.objects.create(
            source_account=accounts[source],
            destination_account=accounts[destination],
            subcategory=None,
            tx_date=tx_date,
            amount=Decimal(amount),
        )
    for tx_date, source, subcategory_name, amount in INTEREST:
        subcategory = Subcategory.objects.get(
            name=subcategory_name, category__name="Interest"
        )
        Transaction.objects.create(
            source_account=accounts[source],
            destination_account=None,
            subcategory=subcategory,
            tx_date=tx_date,
            amount=Decimal(amount),
        )


def unseed(apps, schema_editor):
    Account = apps.get_model("wallets", "Account")
    Transaction = apps.get_model("transactions", "Transaction")
    liabilities = Account.objects.filter(type="liability")
    Transaction.objects.filter(
        Q(source_account__in=liabilities)
        | Q(destination_account__in=liabilities)
        | Q(subcategory__category__name="Interest")
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("transactions", "0007_seed_interest_category"),
        ("wallets", "0005_seed_liabilities"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
