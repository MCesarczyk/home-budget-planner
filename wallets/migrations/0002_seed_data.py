from pathlib import Path

from django.db import migrations

SQL_DIR = Path(__file__).resolve().parent / "sql"


def _sql(name):
    return (SQL_DIR / name).read_text()


class Migration(migrations.Migration):
    dependencies = [("wallets", "0001_initial")]

    operations = [
        migrations.RunSQL(
            _sql("seed_wallets.sql"),
            reverse_sql=(
                "DELETE FROM wallets_account; "
                "DELETE FROM wallets_purpose;"
            ),
        ),
    ]
