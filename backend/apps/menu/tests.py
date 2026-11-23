import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework.test import APIClient

from apps.menu.models import Adicional, Categoria, Producto
from apps.usuarios.models import User


@pytest.mark.django_db
class TestMenuEndpointsAndSeed:
    def setup_method(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin_menu",
            password="StrongPassword123!",
            rol=User.Role.ADMIN,
        )
        self.mesera = User.objects.create_user(
            username="mesera_menu",
            password="StrongPassword123!",
            rol=User.Role.MESERA,
        )

    def _auth_as(self, username: str):
        res = self.client.post(
            reverse("token-obtain-pair"),
            {"username": username, "password": "StrongPassword123!"},
            format="json",
        )
        assert res.status_code == 200
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_seed_menu_is_idempotent_and_populates_full_catalog(self):
        call_command("seed_menu")
        first_cats = Categoria.objects.count()
        first_prods = Producto.objects.count()
        first_adics = Adicional.objects.count()

        assert first_cats == 11
        assert first_prods >= 120
        assert first_adics == 15

        # Ejecutar dos veces no duplica registros
        call_command("seed_menu")
        assert Categoria.objects.count() == first_cats
        assert Producto.objects.count() == first_prods
        assert Adicional.objects.count() == first_adics

    def test_public_menu_excludes_unavailable_products_and_inactive_categories(self):
        cat_active = Categoria.objects.create(nombre="Perros", orden=1, activa=True)
        cat_hidden = Categoria.objects.create(nombre="Oculta", orden=2, activa=False)
        Producto.objects.create(
            categoria=cat_active,
            nombre="Choriperro",
            precio_normal=13000,
            precio_mini=7500,
            disponible=True,
        )
        Producto.objects.create(
            categoria=cat_active,
            nombre="Agotado",
            precio_normal=15000,
            disponible=False,
        )
        Producto.objects.create(
            categoria=cat_hidden,
            nombre="Secreto",
            precio_normal=10000,
            disponible=True,
        )
        Adicional.objects.create(nombre="Gratinado", precio=4000, disponible=True)
        Adicional.objects.create(nombre="Sin stock", precio=3000, disponible=False)

        res = self.client.get(reverse("menu-public"))
        assert res.status_code == 200
        assert len(res.data["categorias"]) == 1
        assert len(res.data["categorias"][0]["productos"]) == 1
        assert res.data["categorias"][0]["productos"][0]["nombre"] == "Choriperro"
        assert res.data["categorias"][0]["productos"][0]["precio_mini"] == 7500
        assert len(res.data["adicionales"]) == 1

    def test_mesera_and_anonymous_cannot_modify_menu(self):
        url = reverse("admin-productos-list")
        assert self.client.get(url).status_code == 401

        self._auth_as("mesera_menu")
        assert self.client.get(url).status_code == 403
        assert (
            self.client.post(url, {"nombre": "Hack", "precio_normal": 1000}, format="json").status_code
            == 403
        )

    def test_admin_crud_productos_y_toggle_disponible(self):
        self._auth_as("admin_menu")

        cat_res = self.client.post(
            reverse("admin-categorias-list"),
            {"nombre": "Asados Test", "color_acento": "verde", "orden": 1},
            format="json",
        )
        assert cat_res.status_code == 201
        cat_id = cat_res.data["id"]

        prod_res = self.client.post(
            reverse("admin-productos-list"),
            {
                "categoria": cat_id,
                "nombre": "Pechuga Gratinada",
                "precio_normal": 27000,
                "precio_mini": 15000,
                "disponible": True,
            },
            format="json",
        )
        assert prod_res.status_code == 201
        prod_id = prod_res.data["id"]
        assert prod_res.data["tiene_mini"] is True

        toggle_res = self.client.post(
            reverse("admin-productos-toggle-disponible", args=[prod_id])
        )
        assert toggle_res.status_code == 200
        assert toggle_res.data["disponible"] is False

        patch_res = self.client.patch(
            reverse("admin-productos-detail", args=[prod_id]),
            {"precio_normal": 28000},
            format="json",
        )
        assert patch_res.status_code == 200
        assert patch_res.data["precio_normal"] == 28000
