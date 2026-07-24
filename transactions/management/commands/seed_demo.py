"""Populate the database with the demo/sample dataset.

Historically this data was inserted by the migrations (transactions.0002/0005/
0007/0008 and wallets.0002/0005). Under the dev/prod split, migrations now carry
*schema only* — a fresh prod DB comes up empty — and this command owns the sample
data. The Docker entrypoint runs it on boot only when DEBUG is on, so dev is
seeded and prod is not.

Migrations ran exactly once; a management command can run on every container
start, so this is written to be idempotent (it no-ops when data already exists)
and atomic (all-or-nothing, so a crash can't leave a half-seeded DB).
"""

from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import connection, transaction

from transactions.models import Category, Subcategory, Transaction
from wallets.models import Account

SQL_DIR = Path(__file__).resolve().parents[2] / "seeds" / "sql"

# Tables seeded with explicit ids (seed_wallets.sql / seed_categories.sql). On
# PostgreSQL, inserting explicit ids does NOT advance the id sequence, so the next
# API-created row would collide on the primary key. Re-point each sequence past
# the seeded max after inserting. No-op on SQLite, whose autoincrement derives
# from MAX(id) at insert time. (Formerly transactions.0006 / wallets.0003.)
SEQUENCE_TABLES = [
    "wallets_purpose",
    "wallets_account",
    "transactions_category",
    "transactions_subcategory",
]

# --- v3 sample liabilities (formerly wallets.0005_seed_liabilities) -------------
# opening_balance is the amount outstanding when tracking starts (negative); it
# climbs toward 0 as the debt is paid down.
LIABILITY_ACCOUNTS = [
    {"name": "Home Mortgage", "opening_balance": Decimal("-250000.00")},
    {"name": "Credit Card", "opening_balance": Decimal("-1500.00")},
]

# --- interest subcategories (formerly transactions.0007_seed_interest_category) -
# Interest paid on liabilities is an expense (it reduces net worth), distinct from
# paying down principal (a net-worth-neutral transfer into the liability account).
INTEREST_SUBCATEGORIES = ["Mortgage Interest", "Loan Interest", "Credit Card Interest"]

# --- v3 sample liability activity (formerly transactions.0008) ------------------
# Principal paydowns are TRANSFERS (cash account -> liability, net-worth neutral).
# (tx_date, source_name, destination_name, amount)
PAYDOWNS = [
    ("2023-08-01", "Main Checking", "Home Mortgage", "800.00"),
    ("2023-10-01", "Main Checking", "Home Mortgage", "800.00"),
    ("2023-12-01", "Main Checking", "Home Mortgage", "800.00"),
    ("2023-11-05", "Main Checking", "Credit Card", "500.00"),
]
# Interest is an EXPENSE from the cash account under the Interest category.
# (tx_date, source_name, subcategory_name, amount)
INTEREST = [
    ("2023-08-01", "Main Checking", "Mortgage Interest", "950.00"),
    ("2023-10-01", "Main Checking", "Mortgage Interest", "945.00"),
    ("2023-12-01", "Main Checking", "Mortgage Interest", "940.00"),
    ("2023-09-15", "Main Checking", "Credit Card Interest", "42.00"),
]


def _sql(name):
    return (SQL_DIR / name).read_text()


class Command(BaseCommand):
    help = "Seed the demo/sample dataset (idempotent; intended for dev only)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Seed even if data already exists (may fail on explicit-id "
            "collisions if the base data is present).",
        )

    def handle(self, *args, **options):
        # Idempotency guard: if the reference data is already there, do nothing.
        # This keeps the command safe to run on every container start.
        if not options["force"] and (
            Category.objects.exists() or Account.objects.exists()
        ):
            self.stdout.write("Demo data already present — skipping seed.")
            return

        with transaction.atomic():
            self._seed()

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))

    def _seed(self):
        with connection.cursor() as cursor:
            # 1. wallets base: purposes + accounts (explicit ids).
            self._exec_script(cursor, "seed_wallets.sql")
            # 2. transactions reference + base transactions (explicit-id categories,
            #    auto-id transactions resolved by subcategory name).
            self._exec_script(cursor, "seed_categories.sql")
            self._exec_script(cursor, "seed_transactions.sql")
            # 3. transfers between the user's own accounts (needs wallets accounts).
            self._exec_script(cursor, "seed_transfers.sql")
            # Re-point sequences past the explicit ids before any ORM insert below
            # assigns a new pk.
            self._reset_sequences(cursor)

        # 4. sample liability accounts.
        for a in LIABILITY_ACCOUNTS:
            Account.objects.get_or_create(
                name=a["name"],
                defaults={
                    "type": "liability",
                    "opening_balance": a["opening_balance"],
                    "is_active": True,
                },
            )

        # 5. interest category + subcategories (no explicit ids — the sequence,
        #    already reset above, assigns them).
        interest_category, _ = Category.objects.get_or_create(
            name="Interest", defaults={"kind": "expense"}
        )
        for name in INTEREST_SUBCATEGORIES:
            Subcategory.objects.get_or_create(category=interest_category, name=name)

        # 6. liability activity: principal paydowns (transfers) + interest (expenses).
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

    @staticmethod
    def _exec_script(cursor, name):
        # A .sql file holds several statements; SQLite's cursor runs one at a time,
        # so split the script the same way migrations.RunSQL does (via sqlparse).
        for statement in connection.ops.prepare_sql_script(_sql(name)):
            cursor.execute(statement)

    @staticmethod
    def _reset_sequences(cursor):
        if connection.vendor != "postgresql":
            return
        for table in SEQUENCE_TABLES:
            cursor.execute(
                "SELECT setval(pg_get_serial_sequence(%s, 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {table}), 1))",
                [table],
            )
