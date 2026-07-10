from pathlib import Path

from django.db import migrations

SQL_DIR = Path(__file__).resolve().parent / "sql"


def _sql(name):
    return (SQL_DIR / name).read_text()


class Migration(migrations.Migration):
    dependencies = [("transactions", "0004_add_transaction_accounts")]

    operations = [
        migrations.RunSQL(
            _sql("seed_transfers.sql"),
            reverse_sql=(
                "DELETE FROM transactions_transaction "
                "WHERE source_account_id IS NOT NULL "
                "AND destination_account_id IS NOT NULL;"
            ),
        ),
    ]
