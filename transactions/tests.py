from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from transactions.models import Category, Subcategory, Transaction
from wallets.models import Account


class SubcategoryConstraintTests(TestCase):
    """DB CHECK constraint ``tx_subcategory_required_for_non_transfer``:
    income/expense must be categorized; transfers may optionally be."""

    @classmethod
    def setUpTestData(cls):
        cls.checking = Account.objects.create(
            name="Checking", type="checking", opening_balance=Decimal("1000")
        )
        cls.savings = Account.objects.create(name="Savings", type="savings")
        income_cat = Category.objects.create(name="Salary", kind=Category.Kind.INCOME)
        cls.income_sub = Subcategory.objects.create(
            category=income_cat, name="Primary Job"
        )
        expense_cat = Category.objects.create(name="Food", kind=Category.Kind.EXPENSE)
        cls.expense_sub = Subcategory.objects.create(
            category=expense_cat, name="Groceries"
        )

    def test_income_without_subcategory_rejected(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Transaction.objects.create(
                    destination_account=self.checking,
                    subcategory=None,
                    tx_date="2024-01-01",
                    amount=Decimal("100"),
                )

    def test_expense_without_subcategory_rejected(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Transaction.objects.create(
                    source_account=self.checking,
                    subcategory=None,
                    tx_date="2024-01-01",
                    amount=Decimal("50"),
                )

    def test_income_with_subcategory_ok(self):
        tx = Transaction.objects.create(
            destination_account=self.checking,
            subcategory=self.income_sub,
            tx_date="2024-01-01",
            amount=Decimal("100"),
        )
        self.assertIsNotNone(tx.pk)

    def test_transfer_without_subcategory_ok(self):
        tx = Transaction.objects.create(
            source_account=self.checking,
            destination_account=self.savings,
            subcategory=None,
            tx_date="2024-01-01",
            amount=Decimal("100"),
        )
        self.assertIsNotNone(tx.pk)

    def test_transfer_with_subcategory_ok(self):
        # The relaxation: a transfer may carry a subcategory (e.g. a mortgage
        # principal payment or an earmarked savings move).
        tx = Transaction.objects.create(
            source_account=self.checking,
            destination_account=self.savings,
            subcategory=self.expense_sub,
            tx_date="2024-01-01",
            amount=Decimal("100"),
        )
        self.assertIsNotNone(tx.pk)


class CommentFieldTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.checking = Account.objects.create(name="Checking", type="checking")
        cls.savings = Account.objects.create(name="Savings", type="savings")

    def test_comment_defaults_to_empty_string(self):
        tx = Transaction.objects.create(
            source_account=self.checking,
            destination_account=self.savings,
            tx_date="2024-01-01",
            amount=Decimal("10"),
        )
        self.assertEqual(tx.comment, "")
        tx.refresh_from_db()
        self.assertEqual(tx.comment, "")

    def test_comment_is_stored(self):
        tx = Transaction.objects.create(
            source_account=self.checking,
            destination_account=self.savings,
            tx_date="2024-01-01",
            amount=Decimal("10"),
            comment="closing transfer",
        )
        tx.refresh_from_db()
        self.assertEqual(tx.comment, "closing transfer")


class TransactionWriteAPITests(APITestCase):
    """Serializer-level shape rules exercised through the real endpoint."""

    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username="tester", password="pw"
        )
        cls.checking = Account.objects.create(
            name="Checking", type="checking", opening_balance=Decimal("1000")
        )
        cls.savings = Account.objects.create(name="Savings", type="savings")
        income_cat = Category.objects.create(name="Salary", kind=Category.Kind.INCOME)
        cls.income_sub = Subcategory.objects.create(
            category=income_cat, name="Primary Job"
        )
        expense_cat = Category.objects.create(name="Food", kind=Category.Kind.EXPENSE)
        cls.expense_sub = Subcategory.objects.create(
            category=expense_cat, name="Groceries"
        )
        cls.url = reverse("transaction-list")

    def setUp(self):
        self.client.force_authenticate(self.user)

    def _post(self, **body):
        return self.client.post(self.url, body, format="json")

    def test_create_categorized_transfer(self):
        resp = self._post(
            tx_date="2024-01-01",
            amount="100.00",
            source_account=self.checking.id,
            destination_account=self.savings.id,
            subcategory=self.expense_sub.id,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["type"], "transfer")
        self.assertEqual(resp.data["subcategory"]["name"], "Groceries")

    def test_create_plain_transfer(self):
        resp = self._post(
            tx_date="2024-01-01",
            amount="100.00",
            source_account=self.checking.id,
            destination_account=self.savings.id,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(resp.data["subcategory"])

    def test_income_requires_subcategory(self):
        resp = self._post(
            tx_date="2024-01-01",
            amount="100.00",
            destination_account=self.checking.id,
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expense_subcategory_kind_must_match(self):
        # An expense tagged with an income-kind subcategory is rejected.
        resp = self._post(
            tx_date="2024-01-01",
            amount="50.00",
            source_account=self.checking.id,
            subcategory=self.income_sub.id,
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_comment_round_trips(self):
        resp = self._post(
            tx_date="2024-01-01",
            amount="34.00",
            source_account=self.checking.id,
            subcategory=self.expense_sub.id,
            comment="Locksmith — spare keys",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["comment"], "Locksmith — spare keys")
        detail = self.client.get(reverse("transaction-detail", args=[resp.data["id"]]))
        self.assertEqual(detail.data["comment"], "Locksmith — spare keys")

    def test_comment_optional_defaults_empty(self):
        resp = self._post(
            tx_date="2024-01-01",
            amount="34.00",
            source_account=self.checking.id,
            subcategory=self.expense_sub.id,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["comment"], "")
