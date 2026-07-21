"""Load seed SQL file(s) into the database, in order, atomically.

This is a **data-free** loader: the SQL it runs lives OUTSIDE the repo (e.g. the
gitignored `dump/` directory, or a path mounted into the prod container at load
time). That keeps private data out of version control and out of the image while
the loading mechanism itself stays committed and reviewable.

Intended for a one-time manual import against a fresh DB, e.g.:

    python manage.py load_seed_sql \\
        dump/prod/seed_accounts.sql \\
        dump/prod/seed_categories.sql \\
        dump/prod/seed_transactions.sql \\
        --reset-sequences wallets_account transactions_category transactions_subcategory

Files run in the order given (put dependencies first). Everything runs in one
transaction, so a failure rolls the whole load back. By default it refuses to run
if the target tables already hold data; pass --force to override.
"""

from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from transactions.models import Category, Transaction
from wallets.models import Account


class Command(BaseCommand):
    help = "Load ordered seed SQL file(s) atomically (data lives outside the repo)."

    def add_arguments(self, parser):
        parser.add_argument(
            "files",
            nargs="+",
            help="SQL file(s) to run, in dependency order (first to last).",
        )
        parser.add_argument(
            "--reset-sequences",
            nargs="*",
            default=[],
            metavar="TABLE",
            help="Tables whose id sequence to re-point past MAX(id) after loading. "
            "Needed on PostgreSQL for tables seeded with explicit ids; no-op on SQLite.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Load even if the target tables already contain data.",
        )

    def handle(self, *args, **options):
        files = [Path(f) for f in options["files"]]
        missing = [str(f) for f in files if not f.is_file()]
        if missing:
            raise CommandError("File(s) not found: " + ", ".join(missing))

        if not options["force"] and (
            Transaction.objects.exists()
            or Account.objects.exists()
            or Category.objects.exists()
        ):
            raise CommandError(
                "Target tables already contain data; refusing to load. "
                "Use --force to load anyway."
            )

        with transaction.atomic(), connection.cursor() as cursor:
            for f in files:
                self.stdout.write(f"  running {f} ...")
                for statement in connection.ops.prepare_sql_script(f.read_text()):
                    cursor.execute(statement)
            self._reset_sequences(cursor, options["reset_sequences"])

        self.stdout.write(self.style.SUCCESS("Seed SQL loaded."))

    @staticmethod
    def _reset_sequences(cursor, tables):
        if not tables or connection.vendor != "postgresql":
            return
        for table in tables:
            cursor.execute(
                "SELECT setval(pg_get_serial_sequence(%s, 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {table}), 1))",
                [table],
            )
