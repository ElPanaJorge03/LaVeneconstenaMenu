import base64
import hashlib
import hmac
import json

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.local.models import ConfigLocal
from apps.menu.models import Categoria, Producto
from apps.pagos.models import Pago
from apps.pedidos.services import crear_pedido, marcar_pago_efectivo


def _sign_bold_payload(raw_body: bytes, secret: str) -> str:
    b64 = base64.b64encode(raw_body)
    return hmac.new(secret.encode("utf-8"), b64, hashlib.sha256).hexdigest()


@pytest.mark.django_db
class TestBoldPaymentsAndWebhook:
    @pytest.fixture(autouse=True)
    def setup_bold(self, settings):
        settings.BOLD_API_KEY = "pub_test_key_123"
        settings.BOLD_SECRET_KEY = "sec_test_key_xyz"
        self.client = APIClient()
        cfg = ConfigLocal.get_solo()
        cfg.abierto = True
        cfg.save()
        cat = Categoria.objects.create(nombre="Hamburguesas", orden=1)
        self.burger = Producto.objects.create(
            categoria=cat,
            nombre="Carne",
            precio_normal=15000,
            disponible=True,
        )
        self.pedido = crear_pedido(
            tipo="recoger",
            cliente_nombre="Sofía",
            telefono="3009998877",
            metodo_pago=Pago.Metodo.BOLD,
            items_data=[{"producto_id": self.burger.id, "cantidad": 2}],
        )

    def test_iniciar_pago_bold_returns_integrity_hash_without_exposing_secret(self):
        res = self.client.post(reverse("bold-iniciar", args=[self.pedido.codigo]))
        assert res.status_code == 200
        assert res.data["configured"] is True
        assert res.data["amount"] == 30000
        assert res.data["currency"] == "COP"
        assert "sec_test_key_xyz" not in json.dumps(res.data)

        expected = hashlib.sha256(
            f"{self.pedido.codigo}30000COPsec_test_key_xyz".encode("utf-8")
        ).hexdigest()
        assert res.data["integritySignature"] == expected

    def test_webhook_rejects_missing_or_invalid_signature(self):
        payload = json.dumps(
            {
                "type": "SALE_APPROVED",
                "data": {"reference": self.pedido.codigo, "amount": {"total": 30000}},
            }
        ).encode("utf-8")

        res_no_sig = self.client.post(
            reverse("bold-webhook"), data=payload, content_type="application/json"
        )
        assert res_no_sig.status_code == 401

        res_bad_sig = self.client.post(
            reverse("bold-webhook"),
            data=payload,
            content_type="application/json",
            HTTP_X_BOLD_SIGNATURE="0000deadbeef",
        )
        assert res_bad_sig.status_code == 401
        self.pedido.pago.refresh_from_db()
        assert self.pedido.pago.estado == Pago.Estado.PENDIENTE

    def test_webhook_confirms_payment_only_with_valid_hmac_signature(self):
        self.client.post(reverse("bold-iniciar", args=[self.pedido.codigo]))

        payload = json.dumps(
            {
                "type": "SALE_APPROVED",
                "data": {
                    "metadata": {"reference": self.pedido.codigo},
                    "amount": {"total": 30000},
                },
            }
        ).encode("utf-8")
        sig = _sign_bold_payload(payload, "sec_test_key_xyz")

        res = self.client.post(
            reverse("bold-webhook"),
            data=payload,
            content_type="application/json",
            HTTP_X_BOLD_SIGNATURE=sig,
        )
        assert res.status_code == 200
        self.pedido.pago.refresh_from_db()
        assert self.pedido.pago.estado == Pago.Estado.PAGADO
        assert self.pedido.pago.pagado_en is not None

    def test_cannot_manually_mark_bold_payment_as_cash(self):
        with pytest.raises(Exception):
            marcar_pago_efectivo(self.pedido)
