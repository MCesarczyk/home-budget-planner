from django.db import migrations


class Migration(migrations.Migration):
    # Sample-data seeding moved out of migrations to the `seed_demo` management
    # command (dev-only), so a fresh prod DB gets schema only. Kept as a no-op —
    # not deleted — so the recorded migration history stays identical across
    # environments. See transactions/management/commands/seed_demo.py.
    dependencies = [("transactions", "0001_initial")]

    operations = []
