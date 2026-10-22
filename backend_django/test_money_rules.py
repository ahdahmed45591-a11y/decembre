"""Regles d'argent, testees sur le comportement (lancer : python manage.py test test_money_rules)."""

import datetime as dt
import hashlib
import hmac
import json
from decimal import Decimal

import jwt
from unittest import mock

from django.conf import settings
from django.test import TestCase, override_settings

from api import brvm
from api.models import Transaction, User


def _client_user(balance=1_000_000):
    return User.objects.create(
        id="CLI-T1", name="T", email="t@x.ci", password="x", role="client",
        kyc="verified", balance=Decimal(balance),
    )


def _post(client, user, path, body):
    token = jwt.encode({"userId": user.id, "role": "client",
                        "exp": dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=1)},
                       settings.JWT_SECRET, algorithm="HS256")
    return client.post(path, json.dumps(body), content_type="application/json",
                       HTTP_AUTHORIZATION=f"Bearer {token}")


def _post_tx(client, user, body):
    return _post(client, user, "/api/transactions", body)


class MoneyRules(TestCase):
    @override_settings(DEV_MODE=True)
    def test_price_comes_from_server(self):
        user = _client_user()
        real = Decimal(str(brvm.find("SNTS")["price"]))
        r = _post_tx(self.client, user, {"ticker": "SNTS", "type": "BUY", "quantity": 1, "price": 1})
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(Transaction.objects.get(user=user).price, real)

    @override_settings(DEV_MODE=False, JEKO_API_KEY="")
    def test_no_fake_deposit_outside_dev_mode(self):
        user = _client_user(0)
        r = _post_tx(self.client, user, {"type": "DEPOSIT", "price": 100000})
        self.assertEqual(r.status_code, 503, r.content)
        user.refresh_from_db()
        self.assertEqual(user.balance, 0)

    @override_settings(JEKO_WEBHOOK_SECRET="s3cret")
    def test_webhook_needs_the_exact_payment_link(self):
        user = _client_user(0)
        Transaction.objects.create(
            id="T1", user=user, ticker="CASH", type="DEPOSIT", quantity=1, price=1000, total=1000,
            fees=0, tva=0, grand_total=1000, status="pending", payment_ref="MANUAL-abc")
        body = json.dumps({"status": "success", "transactionType": "PaymentRequest",
                           "amount": {"amount": 100000}, "transactionDetails": {"paymentLinkId": "other"}}).encode()
        sig = hmac.new(b"s3cret", body, hashlib.sha256).hexdigest()
        r = self.client.post("/api/webhooks/jeko", body, content_type="application/json", HTTP_JEKO_SIGNATURE=sig)
        self.assertEqual(r.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.balance, 0)
        self.assertEqual(Transaction.objects.get(id="T1").status, "pending")

    @override_settings(DEV_MODE=False, PRICE_MAX_AGE_DAYS=-1)
    def test_stale_price_refused(self):
        user = _client_user()
        r = _post_tx(self.client, user, {"ticker": "SNTS", "type": "BUY", "quantity": 1})
        self.assertEqual(r.status_code, 409, r.content)
        self.assertFalse(Transaction.objects.filter(user=user).exists())

    def test_profile_update_never_rewrites_balance(self):
        user = _client_user()
        seen = []
        real_save = User.save

        def spy(self_, *a, **kw):
            seen.append(kw.get("update_fields"))
            return real_save(self_, *a, **kw)

        with mock.patch.object(User, "save", spy):
            r = _post(self.client, user, "/api/auth/profile", {"whatsapp": "0700000000"})
        self.assertEqual(r.status_code, 200, r.content)
        self.assertTrue(seen and all(f is not None and "balance" not in f for f in seen), seen)

    def test_rejected_kyc_can_resubmit_but_suspended_cannot(self):
        png = "iVBORw0KGgpmYWtlLWltYWdlLWJ5dGVz"
        for before, after in (("rejected", "pending"), ("suspended", "suspended")):
            user = _client_user()
            User.objects.filter(id=user.id).update(kyc=before)
            r = _post(self.client, user, "/api/auth/upload-document",
                      {"docType": "selfie", "fileName": "s.png", "fileBase64": png})
            self.assertEqual(r.status_code, 200, r.content)
            user.refresh_from_db()
            self.assertEqual(user.kyc, after)
            user.delete()
