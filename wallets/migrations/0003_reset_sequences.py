from django.db import migrations


class Migration(migrations.Migration):
    # The explicit-id sample data this reset supported now lives in the `seed_demo`
    # management command, which re-points the sequences itself after inserting.
    # Kept as a no-op so recorded migration history stays consistent. See
    # transactions/management/commands/seed_demo.py.
    dependencies = [("wallets", "0002_seed_data")]

    operations = []
