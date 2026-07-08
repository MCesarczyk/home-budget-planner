from pathlib import Path

from django.db import migrations

SQL_DIR = Path(__file__).resolve().parent / "sql"


def _sql(name):
    return (SQL_DIR / name).read_text()


class Migration(migrations.Migration):
    # Adjust to the real initial migration for the `transactions` app.
    dependencies = [("transactions", "0001_initial")]

    operations = [
        migrations.RunSQL(
            _sql("seed_categories.sql"),
            reverse_sql=(
                "DELETE FROM transactions_subcategory; "
                "DELETE FROM transactions_category;"
            ),
        ),
        migrations.RunSQL(
            _sql("seed_transactions.sql"),
            reverse_sql="DELETE FROM transactions_transaction;",
        ),
    ]
