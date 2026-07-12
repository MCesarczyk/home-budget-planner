from django.db import migrations

# A home for interest paid on liabilities (see docs/schema_design.md v3). Interest
# is an expense (it reduces net worth), distinct from paying down principal (a
# net-worth-neutral transfer into the liability account).
SUBCATEGORIES = ["Mortgage Interest", "Loan Interest", "Credit Card Interest"]


def seed_interest(apps, schema_editor):
    Category = apps.get_model("transactions", "Category")
    Subcategory = apps.get_model("transactions", "Subcategory")
    # No explicit ids — let the sequence assign them, so this stays consistent
    # with the sequence reset in 0006 and does not desync it on PostgreSQL.
    category, _ = Category.objects.get_or_create(
        name="Interest", defaults={"kind": "expense"}
    )
    for name in SUBCATEGORIES:
        Subcategory.objects.get_or_create(category=category, name=name)


def unseed_interest(apps, schema_editor):
    Category = apps.get_model("transactions", "Category")
    Subcategory = apps.get_model("transactions", "Subcategory")
    Subcategory.objects.filter(category__name="Interest", name__in=SUBCATEGORIES).delete()
    Category.objects.filter(name="Interest").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("transactions", "0006_reset_sequences"),
    ]

    operations = [
        migrations.RunPython(seed_interest, unseed_interest),
    ]
