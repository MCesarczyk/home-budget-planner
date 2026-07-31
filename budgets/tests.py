from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from budgets.models import BudgetItem, BudgetPlan
from transactions.models import Category, Subcategory


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
