"""Cree le compte admin et le ticket de demonstration, comme data/store.js.

Idempotent : relancable a chaque demarrage sans dupliquer ni ecraser.
"""

import datetime as dt
import os

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from api.models import Ticket, Transaction, User
from api.views import hash_password


class Command(BaseCommand):
    help = "Cree l'administrateur par defaut et les donnees de demonstration."

    def handle(self, *args, **options):
        email = os.environ.get("ADMIN_EMAIL", "admin@elephantbourse.ci")
        password = os.environ.get("ADMIN_PASSWORD")
        if not password and not User.objects.filter(id="ADMIN-001").exists():
            raise CommandError("ADMIN_PASSWORD est obligatoire pour creer le compte admin.")

        admin, created = User.objects.get_or_create(
            id="ADMIN-001",
            defaults={
                "name": "M. Cissé",
                "email": email,
                "password": hash_password(password or ""),
                "role": "admin",
                "level": 4,
                "avatar": "MK",
                "joined_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            },
        )
        self.stdout.write(f"Admin {'cree' if created else 'deja present'} : {admin.email}")

        Ticket.objects.get_or_create(
            id="TKT-1002",
            defaults={
                "client_name": "Mamadou Konaté",
                "client_id": "mamadou.konate@email.ci",
                "subject": "Assistance Inscription",
                "message": "Bonjour, j'ai besoin d'aide pour valider mon contrat.",
                "status": "OUVERT",
                "date_string": "Aujourd'hui, 10:15",
            },
        )

        if not settings.DEV_MODE:
            return  # compte demo (mot de passe public) : developpement seulement

        # Compte de demonstration demo@baou.ci
        demo_user, _ = User.objects.get_or_create(
            email="demo@baou.ci",
            defaults={
                "id": "CLI-DEMO-001",
                "name": "Abou Demo",
                "password": hash_password("Password123"),
                "role": "client",
                "level": 1,
                "kyc": "verified",
                "whatsapp": "0700000000",
                "joined_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            },
        )
        demo_user.balance = 156000
        demo_user.kyc = "verified"

        # Portefeuille : Sonatel CI (3), BOA Côte d'Ivoire (9), BICICI (7)
        stocks_data = [
            ("SNTS", "Sonatel CI", 3, 16850),
            ("BOAC", "BOA Côte d'Ivoire", 9, 7200),
            ("BICI", "BICICI", 7, 7800),
        ]
        now_str = dt.datetime.now(dt.timezone.utc).isoformat()
        for ticker, company, qty, price in stocks_data:
            total_val = qty * price
            Transaction.objects.update_or_create(
                id=f"TX-DEMO-{ticker}",
                defaults={
                    "user": demo_user,
                    "user_email": demo_user.email,
                    "user_name": demo_user.name,
                    "ticker": ticker,
                    "company": company,
                    "type": "BUY",
                    "quantity": qty,
                    "price": price,
                    "total": total_val,
                    "fees": round(total_val * 0.005, 2),
                    "tva": round(total_val * 0.005 * 0.18, 2),
                    "grand_total": total_val,
                    "status": "validated",
                    "payment_ref": f"DEMO-{ticker}",
                    "payment_method": "Solde BAOU",
                    "submitted_at": now_str,
                    "processed_at": now_str,
                    "processed_by": "SYSTEM",
                },
            )

        demo_user.save()
        self.stdout.write(f"Demo user ok : solde={demo_user.balance}")
