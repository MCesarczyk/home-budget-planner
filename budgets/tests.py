from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from budgets.models import BudgetItem, BudgetPlan
from transactions.models import Category, Subcategory, Transaction
from wallets.models import Account, Purpose


class BudgetPlanTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="t", password="pw")
        income = Category.objects.create(name="Salary", kind=Category.Kind.INCOME)
        expense = Category.objects.create(name="Housing", kind=Category.Kind.EXPENSE)
        cls.salary = Subcategory.objects.create(category=income, name="Primary Job")
        cls.rent = Subcategory.objects.create(category=expense, name="Rent")
        cls.electricity = Subcategory.objects.create(category=expense, name="Electricity")

    def setUp(self):
        self.client.force_authenticate(self.user)

    def _create(self, **body):
        return self.client.post(reverse("budget-plan-list"), body, format="json")

    def test_create_plan_with_items(self):
        resp = self._create(
            month="2026-07-01",
            items=[
                {"subcategory": self.salary.id, "amount": "5000.00"},
                {"subcategory": self.rent.id, "amount": "1500.00"},
                {"subcategory": self.electricity.id, "amount": "200.00"},
            ],
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(resp.data["items"]), 3)
        self.assertEqual(Decimal(str(resp.data["planned_income"])), Decimal("5000.00"))
        self.assertEqual(Decimal(str(resp.data["planned_expense"])), Decimal("1700.00"))
        # Read shape expands the subcategory and its category.
        item = resp.data["items"][0]
        self.assertIn("category", item["subcategory"])

    def test_month_normalized_to_first_day(self):
        resp = self._create(
            month="2026-07-15",
            items=[{"subcategory": self.rent.id, "amount": "1500.00"}],
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["month"], "2026-07-01")

    def test_one_plan_per_month(self):
        self._create(month="2026-07-01", items=[])
        resp = self._create(month="2026-07-20", items=[])
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_subcategory_rejected(self):
        resp = self._create(
            month="2026-07-01",
            items=[
                {"subcategory": self.rent.id, "amount": "1500.00"},
                {"subcategory": self.rent.id, "amount": "1600.00"},
            ],
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_positive_amount_rejected(self):
        resp = self._create(
            month="2026-07-01",
            items=[{"subcategory": self.rent.id, "amount": "0.00"}],
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_replaces_items(self):
        created = self._create(
            month="2026-07-01",
            items=[{"subcategory": self.rent.id, "amount": "1500.00"}],
        )
        plan_id = created.data["id"]
        resp = self.client.put(
            reverse("budget-plan-detail", args=[plan_id]),
            {
                "month": "2026-07-01",
                "items": [{"subcategory": self.electricity.id, "amount": "200.00"}],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data["items"]), 1)
        self.assertEqual(
            resp.data["items"][0]["subcategory"]["id"], self.electricity.id
        )
        self.assertEqual(BudgetItem.objects.filter(budget_plan=plan_id).count(), 1)

    def test_filter_by_month(self):
        self._create(
            month="2026-07-01",
            items=[{"subcategory": self.rent.id, "amount": "1500.00"}],
        )
        self._create(
            month="2026-08-01",
            items=[{"subcategory": self.rent.id, "amount": "1600.00"}],
        )
        resp = self.client.get(reverse("budget-plan-list"), {"month": "2026-08"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["month"], "2026-08-01")


class BudgetProgressTests(APITestCase):
    """Plan-vs-actual: planned amounts joined to actual transactions in the
    plan's month, including unbudgeted spend."""

    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="t", password="pw")
        income = Category.objects.create(name="Salary", kind=Category.Kind.INCOME)
        expense = Category.objects.create(name="Housing", kind=Category.Kind.EXPENSE)
        cls.salary = Subcategory.objects.create(category=income, name="Primary Job")
        cls.rent = Subcategory.objects.create(category=expense, name="Rent")
        cls.electricity = Subcategory.objects.create(category=expense, name="Electricity")
        cls.water = Subcategory.objects.create(category=expense, name="Water")
        cls.checking = Account.objects.create(name="Checking", type="checking")

        cls.plan = BudgetPlan.objects.create(month="2026-07-01")
        BudgetItem.objects.create(budget_plan=cls.plan, subcategory=cls.salary, amount="5000.00")
        BudgetItem.objects.create(budget_plan=cls.plan, subcategory=cls.rent, amount="1500.00")
        BudgetItem.objects.create(budget_plan=cls.plan, subcategory=cls.electricity, amount="200.00")

        # Actuals inside the plan month.
        Transaction.objects.create(
            destination_account=cls.checking, subcategory=cls.salary,
            tx_date="2026-07-25", amount="5000.00",
        )
        Transaction.objects.create(
            source_account=cls.checking, subcategory=cls.rent,
            tx_date="2026-07-01", amount="1500.00",
        )
        Transaction.objects.create(  # over budget on electricity
            source_account=cls.checking, subcategory=cls.electricity,
            tx_date="2026-07-10", amount="260.00",
        )
        Transaction.objects.create(  # unbudgeted: Water has no plan line
            source_account=cls.checking, subcategory=cls.water,
            tx_date="2026-07-12", amount="70.00",
        )
        # Outside the month — must be ignored.
        Transaction.objects.create(
            source_account=cls.checking, subcategory=cls.rent,
            tx_date="2026-08-01", amount="1500.00",
        )

    def setUp(self):
        self.client.force_authenticate(self.user)

    def _lines(self, resp):
        return {
            s["name"]: s
            for c in resp.data["categories"]
            for s in c["subcategories"]
        }

    def test_progress_joins_actuals(self):
        resp = self.client.get(reverse("budget-plan-progress", args=[self.plan.id]))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        lines = self._lines(resp)
        self.assertEqual(Decimal(str(lines["Rent"]["actual"])), Decimal("1500.00"))
        self.assertEqual(Decimal(str(lines["Rent"]["remaining"])), Decimal("0.00"))
        self.assertEqual(lines["Rent"]["progress"], 1.0)
        # Over budget -> progress > 1, remaining negative.
        self.assertEqual(Decimal(str(lines["Electricity"]["remaining"])), Decimal("-60.00"))
        self.assertGreater(lines["Electricity"]["progress"], 1.0)

    def test_unbudgeted_spend_included(self):
        resp = self.client.get(reverse("budget-plan-progress", args=[self.plan.id]))
        water = self._lines(resp)["Water"]
        self.assertEqual(Decimal(str(water["planned"])), Decimal("0.00"))
        self.assertEqual(Decimal(str(water["actual"])), Decimal("70.00"))
        self.assertIsNone(water["progress"])  # no plan to divide by

    def test_transactions_outside_month_excluded(self):
        resp = self.client.get(reverse("budget-plan-progress", args=[self.plan.id]))
        # The August rent (1500) must not inflate July's rent actual.
        self.assertEqual(
            Decimal(str(self._lines(resp)["Rent"]["actual"])), Decimal("1500.00")
        )

    def test_totals_split_by_kind(self):
        resp = self.client.get(reverse("budget-plan-progress", args=[self.plan.id]))
        totals = resp.data["totals"]
        self.assertEqual(Decimal(str(totals["income"]["planned"])), Decimal("5000.00"))
        self.assertEqual(Decimal(str(totals["income"]["actual"])), Decimal("5000.00"))
        # expense planned 1700 (rent+electricity), actual 1830 (1500+260+70 water).
        self.assertEqual(Decimal(str(totals["expense"]["planned"])), Decimal("1700.00"))
        self.assertEqual(Decimal(str(totals["expense"]["actual"])), Decimal("1830.00"))

    def test_current_progress_route(self):
        resp = self.client.get("/api/v1/budget-plans/current/progress/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["id"], self.plan.id)


class OffBudgetProgressTests(APITestCase):
    """An off-budget purpose (e.g. an emergency fund): the contribution into it
    counts as spend, but money spent back out of it does not."""

    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="t", password="pw")
        savings = Category.objects.create(name="Savings", kind=Category.Kind.EXPENSE)
        housing = Category.objects.create(name="Housing", kind=Category.Kind.EXPENSE)
        cls.emergency = Subcategory.objects.create(category=savings, name="Emergency fund")
        cls.rent = Subcategory.objects.create(category=housing, name="Rent")

        cls.checking = Account.objects.create(name="Checking", type="checking")
        fund = Purpose.objects.create(name="Emergency fund", is_off_budget=True)
        cls.deposit = Account.objects.create(name="Deposit A", type="savings", purpose=fund)
        cls.deposit2 = Account.objects.create(name="Deposit B", type="savings", purpose=fund)

        cls.plan = BudgetPlan.objects.create(month="2026-07-01")
        BudgetItem.objects.create(budget_plan=cls.plan, subcategory=cls.emergency, amount="1000.00")
        BudgetItem.objects.create(budget_plan=cls.plan, subcategory=cls.rent, amount="1500.00")

        # Contribution into the fund (a categorised transfer) — counts as spend.
        Transaction.objects.create(
            source_account=cls.checking, destination_account=cls.deposit,
            subcategory=cls.emergency, tx_date="2026-07-05", amount="1000.00",
        )
        # A normal rent expense — counts.
        Transaction.objects.create(
            source_account=cls.checking, subcategory=cls.rent,
            tx_date="2026-07-02", amount="1500.00",
        )
        # Purpose-spend out of the fund, categorised — must NOT count.
        Transaction.objects.create(
            source_account=cls.deposit, subcategory=cls.rent,
            tx_date="2026-07-20", amount="800.00",
        )
        # Deposit A rolls into deposit B on maturity — must NOT count.
        Transaction.objects.create(
            source_account=cls.deposit, destination_account=cls.deposit2,
            tx_date="2026-07-28", amount="200.00",
        )

    def setUp(self):
        self.client.force_authenticate(self.user)

    def _lines(self, resp):
        return {s["name"]: s for c in resp.data["categories"] for s in c["subcategories"]}

    def test_contribution_realises_line_but_fund_spend_ignored(self):
        resp = self.client.get(reverse("budget-plan-progress", args=[self.plan.id]))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        lines = self._lines(resp)
        self.assertEqual(Decimal(str(lines["Emergency fund"]["actual"])), Decimal("1000.00"))
        # Rent shows only the checking expense, not the 800 spent out of the fund.
        self.assertEqual(Decimal(str(lines["Rent"]["actual"])), Decimal("1500.00"))

    def test_expense_total_excludes_fund_outflows(self):
        resp = self.client.get(reverse("budget-plan-progress", args=[self.plan.id]))
        # 1000 contribution + 1500 rent; the 800 fund-spend and 200 rollover excluded.
        self.assertEqual(
            Decimal(str(resp.data["totals"]["expense"]["actual"])), Decimal("2500.00")
        )
