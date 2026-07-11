from django.db import migrations

# Tables seeded with explicit ids (seed_categories.sql). On PostgreSQL, inserting
# explicit ids does NOT advance the id sequence, so the next API-created row would
# collide on the primary key. Re-point each sequence past the seeded max. No-op on
# SQLite, whose autoincrement is derived from MAX(id) at insert time.
TABLES = ["transactions_category", "transactions_subcategory"]


def reset_sequences(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        for table in TABLES:
            cursor.execute(
                "SELECT setval(pg_get_serial_sequence(%s, 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {table}), 1))",
                [table],
            )


class Migration(migrations.Migration):
    dependencies = [
        ("transactions", "0005_seed_transfers"),
    ]

    operations = [
        migrations.RunPython(reset_sequences, migrations.RunPython.noop),
    ]
