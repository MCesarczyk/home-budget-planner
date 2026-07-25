from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from wallets.models import Account


class ArchiveRuleTests(APITestCase):
    """AccountSerializer zero-balance archive invariant: an account can only be
    archived (is_active True -> False) once its computed balance is zero."""

    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="t", password="pw")

    def setUp(self):
        self.client.force_authenticate(self.user)

    def _patch(self, account, **body):
        return self.client.patch(
            reverse("account-detail", args=[account.id]), body, format="json"
        )

    def test_cannot_archive_account_with_balance(self):
        acc = Account.objects.create(
            name="Funded", type="savings", opening_balance=Decimal("100")
        )
        resp = self._patch(acc, is_active=False)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        acc.refresh_from_db()
        self.assertTrue(acc.is_active)

    def test_can_archive_empty_account(self):
        acc = Account.objects.create(
            name="Empty", type="savings", opening_balance=Decimal("0")
        )
        resp = self._patch(acc, is_active=False)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        acc.refresh_from_db()
        self.assertFalse(acc.is_active)

    def test_can_reactivate_account(self):
        acc = Account.objects.create(
            name="Archived",
            type="savings",
            opening_balance=Decimal("0"),
            is_active=False,
        )
        resp = self._patch(acc, is_active=True)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        acc.refresh_from_db()
        self.assertTrue(acc.is_active)

    def test_editing_already_archived_account_not_blocked(self):
        # The rule fires only on the active -> inactive transition. Editing an
        # already-archived account (even one still showing a balance, as the
        # seeded data may) must not be blocked.
        acc = Account.objects.create(
            name="Old",
            type="savings",
            opening_balance=Decimal("500"),
            is_active=False,
        )
        resp = self._patch(acc, name="Old Renamed")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        acc.refresh_from_db()
        self.assertEqual(acc.name, "Old Renamed")

    def test_create_inactive_account_with_balance_rejected(self):
        resp = self.client.post(
            reverse("account-list"),
            {
                "name": "New",
                "type": "savings",
                "opening_balance": "100.00",
                "is_active": False,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_inactive_account_zero_balance_ok(self):
        resp = self.client.post(
            reverse("account-list"),
            {
                "name": "New",
                "type": "savings",
                "opening_balance": "0.00",
                "is_active": False,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class NetWorthReportTests(APITestCase):
    """The net-worth report omits inactive accounts from both the account lists
    and the totals."""

    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="t", password="pw")
        cls.active = Account.objects.create(
            name="Active", type="savings", opening_balance=Decimal("1000")
        )
        cls.inactive = Account.objects.create(
            name="Inactive",
            type="savings",
            opening_balance=Decimal("500"),
            is_active=False,
        )

    def setUp(self):
        self.client.force_authenticate(self.user)

    def test_networth_excludes_inactive_accounts(self):
        resp = self.client.get(reverse("report-net-worth"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        names = [a["name"] for a in resp.data["assets"] + resp.data["liabilities"]]
        self.assertIn("Active", names)
        self.assertNotIn("Inactive", names)
        # Totals reflect only the active account's balance, not the archived 500.
        self.assertEqual(Decimal(str(resp.data["total_assets"])), Decimal("1000"))
        self.assertEqual(Decimal(str(resp.data["net_worth"])), Decimal("1000"))
