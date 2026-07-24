from django.db import migrations


class Migration(migrations.Migration):
    # Sample-data seeding moved to the `seed_demo` management command (dev-only).
    # Kept as a no-op so recorded migration history stays consistent. See
    # transactions/management/commands/seed_demo.py.
    dependencies = [("transactions", "0006_reset_sequences")]

    operations = []
