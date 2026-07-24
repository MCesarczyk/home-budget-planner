from django.db import migrations


class Migration(migrations.Migration):
    # Sample-data seeding moved to the `seed_demo` management command (dev-only).
    # Kept as a no-op so recorded migration history stays consistent. The
    # cross-app dependency on wallets is preserved to keep the graph valid. See
    # transactions/management/commands/seed_demo.py.
    dependencies = [
        ("transactions", "0007_seed_interest_category"),
        ("wallets", "0005_seed_liabilities"),
    ]

    operations = []
