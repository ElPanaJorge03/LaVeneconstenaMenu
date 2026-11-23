import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.mesas.models import Mesa
from apps.usuarios.models import User


@pytest.mark.django_db
class TestMesasAndQR:
    def setup_method(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_mesas",
            password="StrongPassword123!",
            rol=User.Role.ADMIN,
        )
        self.mesera = User.objects.create_user(
            username="mesera_mesas",
            password="StrongPassword123!",
            rol=User.Role.MESERA,
        )

    def _auth(self, username: str):
        res = self.client.post(
            reverse("token-obtain-pair"),
            {"username": username, "password": "StrongPassword123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_admin_crud_mesa_and_download_qr_png(self):
        self._auth("admin_mesas")

        create_res = self.client.post(
            reverse("admin-mesas-list"),
            {"numero": 7, "nombre": "Terraza 7", "activa": True},
            format="json",
        )
        assert create_res.status_code == 201
        mesa_id = create_res.data["id"]
        assert create_res.data["qr_target_url"].endswith(f"/mesa/{mesa_id}")

        qr_res = self.client.get(reverse("admin-mesas-qr", args=[mesa_id]))
        assert qr_res.status_code == 200
        assert qr_res["Content-Type"] == "image/png"
        assert qr_res.content[:8] == b"\x89PNG\r\n\x1a\n"

        # Público puede leer mesa activa, pero no inactiva
        self.client.credentials()
        pub_res = self.client.get(reverse("mesas-public-detail", args=[mesa_id]))
        assert pub_res.status_code == 200
        assert pub_res.data["numero"] == 7

        Mesa.objects.filter(pk=mesa_id).update(activa=False)
        assert self.client.get(reverse("mesas-public-detail", args=[mesa_id])).status_code == 404

    def test_mesera_can_list_active_mesas_but_not_admin_crud(self):
        Mesa.objects.create(numero=1, activa=True)
        self._auth("mesera_mesas")
        assert self.client.get(reverse("mesas-activas")).status_code == 200
        assert self.client.post(reverse("admin-mesas-list"), {"numero": 2}, format="json").status_code == 403
