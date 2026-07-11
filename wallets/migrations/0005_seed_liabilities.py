from decimal import Decimal

from django.db import migrations

# Sample liability accounts (v3). opening_balance is the amount outstanding when
# tracking starts (negative); it climbs toward 0 as the debt is paid down. No
# explicit ids — the sequence assigns them (consistent with 0006 reset on PG).
ACCOUNTS = [
    {"name": "Home Mortgage", "opening_balance": Decimal("-250000.00")},
    {"name": "Credit Card", "opening_balance": Decimal("-1500.00")},
]


def seed(apps, schema_editor):
    Account = apps.get_model("wallets", "Account")
    for a in ACCOUNTS:
        Account.objects.get_or_create(
            name=a["name"],
            defaults={
                "type": "liability",
                "opening_balance": a["opening_balance"],
                "is_active": True,
            },
        )


def unseed(apps, schema_editor):
    Account = apps.get_model("wallets", "Account")
    Account.objects.filter(name__in=[a["name"] for a in ACCOUNTS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("wallets", "0004_alter_account_type"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
