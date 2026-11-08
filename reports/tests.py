from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from transactions.models import Category, Subcategory, Transaction
from wallets.models import Account, Purpose


class OffBudgetReportTests(APITestCase):
    """Spending treats a contribution into an off-budget account as spend and
    ignores anything spent back out of it (budget view). Cashflow instead tracks
    net worth: transfers are ignored, external flows on any account count."""

    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="t", password="pw")
        savings = Category.objects.create(name="Savings", kind=Category.Kind.EXPENSE)
        housing = Category.objects.create(name="Housing", kind=Category.Kind.EXPENSE)
        cls.emergency = Subcategory.objects.create(
            category=savings, name="Emergency fund"
        )
        cls.rent = Subcategory.objects.create(category=housing, name="Rent")

        cls.checking = Account.objects.create(name="Checking", type="checking")
        fund = Purpose.objects.create(name="Emergency fund", is_off_budget=True)
        cls.deposit = Account.objects.create(
            name="Deposit", type="savings", purpose=fund
        )

        # Contribution into the fund (transfer) — spend.
        Transaction.objects.create(
            source_account=cls.checking,
            destination_account=cls.deposit,
            subcategory=cls.emergency,
            tx_date="2026-07-05",
            amount="1000.00",
        )
        # Normal expense — spend.
        Transaction.objects.create(
            source_account=cls.checking,
            subcategory=cls.rent,
            tx_date="2026-07-02",
            amount="1500.00",
        )
        # Purpose-spend out of the fund — not spend.
        Transaction.objects.create(
            source_account=cls.deposit,
            subcategory=cls.rent,
            tx_date="2026-07-20",
            amount="800.00",
        )

    def setUp(self):
        self.client.force_authenticate(self.user)

    def test_spending_counts_contribution_not_fund_spend(self):
        resp = self.client.get(reverse("report-spending"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        totals = {c["name"]: Decimal(str(c["total"])) for c in resp.data["categories"]}
        self.assertEqual(totals.get("Savings"), Decimal("1000.00"))
        # Housing shows only the checking rent; the 800 from the fund is excluded.
        self.assertEqual(totals.get("Housing"), Decimal("1500.00"))
        self.assertEqual(Decimal(str(resp.data["total"])), Decimal("2500.00"))

    def test_cashflow_tracks_net_worth_not_budget(self):
        """Cashflow ignores the contribution (a transfer — net worth unchanged)
        and counts the fund spend (money really left), so net == Δ net worth."""
        resp = self.client.get(reverse("report-cashflow"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        totals = resp.data["totals"]
        self.assertEqual(Decimal(str(totals["expense"])), Decimal("2300.00"))
        self.assertEqual(Decimal(str(totals["income"])), Decimal("0.00"))
        self.assertEqual(Decimal(str(totals["net"])), Decimal("-2300.00"))

        # Net equals the change in net worth (opening balances are zero here).
        nw = self.client.get(reverse("report-net-worth")).data
        self.assertEqual(Decimal(str(totals["net"])), Decimal(str(nw["net_worth"])))

    def test_cashflow_counts_income_into_off_budget_account(self):
        interest = Subcategory.objects.create(
            category=Category.objects.create(
                name="Interest", kind=Category.Kind.INCOME
            ),
            name="Deposit interest",
        )
        Transaction.objects.create(
            destination_account=self.deposit,
            subcategory=interest,
            tx_date="2026-07-31",
            amount="12.50",
        )
        resp = self.client.get(reverse("report-cashflow"))
        self.assertEqual(Decimal(str(resp.data["totals"]["income"])), Decimal("12.50"))
