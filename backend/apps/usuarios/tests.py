import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.usuarios.models import User


@pytest.mark.django_db
class TestAuthAndRolePermissions:
    def setup_method(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username="admin_test",
            password="StrongPassword123!",
            rol=User.Role.ADMIN,
        )
        self.mesera_user = User.objects.create_user(
            username="mesera_test",
            password="StrongPassword123!",
            rol=User.Role.MESERA,
        )

    def _login(self, username: str) -> str:
        res = self.client.post(
            reverse("token-obtain-pair"),
            {"username": username, "password": "StrongPassword123!"},
            format="json",
        )
        assert res.status_code == 200
        return res.data["access"]

    def test_anonymous_cannot_access_protected_endpoints(self):
        assert self.client.get(reverse("auth-me")).status_code == 401
        assert self.client.get(reverse("auth-check-panel")).status_code == 401
        assert self.client.get(reverse("auth-check-admin")).status_code == 401

    def test_mesera_can_access_panel_but_not_admin(self):
        token = self._login("mesera_test")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        assert self.client.get(reverse("auth-check-panel")).status_code == 200
        assert self.client.get(reverse("auth-check-admin")).status_code == 403

    def test_admin_can_access_both_panel_and_admin(self):
        token = self._login("admin_test")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        assert self.client.get(reverse("auth-check-panel")).status_code == 200
        assert self.client.get(reverse("auth-check-admin")).status_code == 200

    def test_superuser_automatically_gets_admin_role(self):
        su = User.objects.create_superuser(
            username="root_railway",
            email="root@example.com",
            password="StrongPassword123!",
        )
        assert su.rol == User.Role.ADMIN
        assert su.is_admin_role is True
