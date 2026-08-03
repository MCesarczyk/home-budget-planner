from django.db.models import Q


def off_budget_account_ids():
    """Ids of accounts earmarked to an off-budget purpose (e.g. an emergency
    fund's deposits). Loaded lazily to avoid an app-registry import cycle."""
    from wallets.models import Account

    return list(
        Account.objects.filter(purpose__is_off_budget=True).values_list("id", flat=True)
    )


def flow_predicates(off_ids):
    """Income/expense Q filters against the on-budget boundary.

    expense — money leaving the on-budget world: spent externally, or set aside
    into an off-budget account (a fund contribution). income — money entering it
    from outside. A transaction sourced from an off-budget account is neither: it
    was already accounted for when the money was set aside.

    With no off-budget accounts these reduce to the plain leg-shape predicates
    (source-only = expense, destination-only = income), so behaviour is unchanged."""
    off = list(off_ids)
    expense = (
        Q(source_account__isnull=False)
        & ~Q(source_account__in=off)
        & (Q(destination_account__isnull=True) | Q(destination_account__in=off))
    )
    income = (
        Q(source_account__isnull=True)
        & Q(destination_account__isnull=False)
        & ~Q(destination_account__in=off)
    )
    return income, expense
