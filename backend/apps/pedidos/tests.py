import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.local.models import ConfigLocal
from apps.menu.models import Adicional, Categoria, Producto
from apps.mesas.models import Mesa
from apps.pedidos.models import Pedido
from apps.usuarios.models import User


@pytest.mark.django_db
class TestPedidosFlowAndSecurity:
    def setup_method(self):
        self.client = APIClient()
        self.local = ConfigLocal.get_solo()
        self.local.abierto = True
        self.local.save()

        self.cat = Categoria.objects.create(nombre="Perros Calientes", orden=1)
        self.choriperro = Producto.objects.create(
            categoria=self.cat,
            nombre="Choriperro",
            precio_normal=13000,
            precio_mini=7500,
            disponible=True,
        )
        self.sin_precio = Producto.objects.create(
            categoria=self.cat,
            nombre="Agua sin precio",
            precio_normal=0,
            disponible=True,
        )
        self.agotado = Producto.objects.create(
            categoria=self.cat,
            nombre="Agotado",
            precio_normal=15000,
            disponible=False,
        )
        self.gratinado = Adicional.objects.create(
            nombre="Gratinado", precio=4000, disponible=True
        )
        self.tocineta = Adicional.objects.create(
            nombre="Tocineta", precio=3000, disponible=True
        )
        self.mesa = Mesa.objects.create(numero=4, activa=True)

        self.mesera = User.objects.create_user(
            username="mesera_pedidos",
            password="StrongPassword123!",
            rol=User.Role.MESERA,
        )

    def test_backend_recalculates_total_and_hides_private_data_in_tracking(self):
        payload = {
            "tipo": "domicilio",
            "cliente_nombre": "María Pérez",
            "telefono": "3001234567",
            "direccion": "Calle 45 #12-34 Barrio Centro",
            "notas": "Timbrar fuerte",
            "metodo_pago": "efectivo",
            # Intento malicioso de alterar el total desde el cliente (debe ignorarse)
            "total": 1,
            "items": [
                {
                    "producto_id": self.choriperro.id,
                    "tamano": "mini",
                    "cantidad": 2,
                    "adicionales_ids": [self.gratinado.id, self.tocineta.id],
                    "precio_unitario": 100,
                    "notas": "Sin cebolla",
                }
            ],
        }
        res = self.client.post(reverse("pedidos-public-create"), payload, format="json")
        assert res.status_code == 201

        # (7.500 MINI + 4.000 Gratinado + 3.000 Tocineta) * 2 = 29.000 COP exactos
        assert res.data["total"] == 29000
        assert res.data["estado"] == "nuevo"
        assert res.data["pago"]["estado"] == "pendiente"
        assert res.data["codigo"].startswith("VC-")

        # Privacidad en seguimiento: no expone teléfono ni dirección
        track_res = self.client.get(
            reverse("pedidos-public-tracking", args=[res.data["codigo"]])
        )
        assert track_res.status_code == 200
        assert track_res.data["total"] == 29000
        assert track_res.data["cliente_primer_nombre"] == "María"
        assert "telefono" not in track_res.data
        assert "direccion" not in track_res.data

    def test_domicilio_requires_direccion_and_closed_local_blocks_orders(self):
        # Falta dirección en domicilio -> 400
        res = self.client.post(
            reverse("pedidos-public-create"),
            {
                "tipo": "domicilio",
                "cliente_nombre": "Carlos",
                "telefono": "3000000000",
                "items": [{"producto_id": self.choriperro.id, "cantidad": 1}],
            },
            format="json",
        )
        assert res.status_code == 400
        assert "direccion" in res.data

        # Local cerrado -> 400
        self.local.abierto = False
        self.local.save()
        closed_res = self.client.post(
            reverse("pedidos-public-create"),
            {
                "tipo": "recoger",
                "cliente_nombre": "Carlos",
                "telefono": "3000000000",
                "items": [{"producto_id": self.choriperro.id, "cantidad": 1}],
            },
            format="json",
        )
        assert closed_res.status_code == 400

    def test_rejects_unavailable_or_zero_price_products(self):
        for bad_prod in (self.agotado, self.sin_precio):
            res = self.client.post(
                reverse("pedidos-public-create"),
                {
                    "tipo": "mesa",
                    "mesa_id": self.mesa.id,
                    "cliente_nombre": "Ana",
                    "items": [{"producto_id": bad_prod.id, "cantidad": 1}],
                },
                format="json",
            )
            assert res.status_code == 400

    def test_state_transitions_and_role_protection(self):
        create_res = self.client.post(
            reverse("pedidos-public-create"),
            {
                "tipo": "mesa",
                "mesa_id": self.mesa.id,
                "cliente_nombre": "Luis",
                "items": [{"producto_id": self.choriperro.id, "cantidad": 1}],
            },
            format="json",
        )
        assert create_res.status_code == 201
        pedido = Pedido.objects.get(codigo=create_res.data["codigo"])

        change_url = reverse("pedidos-panel-change-estado", args=[pedido.id])
        # Anónimo no puede cambiar estado
        assert self.client.post(change_url, {"estado": "preparando"}, format="json").status_code == 401

        # Autenticar mesera
        token_res = self.client.post(
            reverse("token-obtain-pair"),
            {"username": "mesera_pedidos", "password": "StrongPassword123!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_res.data['access']}")

        # Transición inválida: nuevo -> entregado directo falla (400)
        assert self.client.post(change_url, {"estado": "entregado"}, format="json").status_code == 400

        # Flujo válido: nuevo -> preparando -> listo -> entregado
        for next_state in ("preparando", "listo", "entregado"):
            ok_res = self.client.post(change_url, {"estado": next_state}, format="json")
            assert ok_res.status_code == 200
            assert ok_res.data["estado"] == next_state

    def test_manual_order_cash_confirmation_and_sales_summary(self):
        admin = User.objects.create_user(
            username="admin_ventas",
            password="StrongPassword123!",
            rol=User.Role.ADMIN,
        )
        # Mesera crea pedido manual en mesa incluso si local está cerrado
        self.local.abierto = False
        self.local.save()

        token_mesera = self.client.post(
            reverse("token-obtain-pair"),
            {"username": "mesera_pedidos", "password": "StrongPassword123!"},
            format="json",
        ).data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_mesera}")

        manual_res = self.client.post(
            reverse("pedidos-panel-manual"),
            {
                "tipo": "mesa",
                "mesa_id": self.mesa.id,
                "items": [{"producto_id": self.choriperro.id, "cantidad": 2}],
            },
            format="json",
        )
        assert manual_res.status_code == 201
        assert manual_res.data["total"] == 26000
        assert manual_res.data["pago"]["estado"] == "pendiente"

        # Confirmar efectivo recibido
        cash_res = self.client.post(
            reverse("pedidos-panel-marcar-efectivo", args=[manual_res.data["id"]])
        )
        assert cash_res.status_code == 200
        assert cash_res.data["pago"]["estado"] == "pagado"

        # Mesera NO accede a ventas admin (403)
        assert self.client.get(reverse("pedidos-admin-ventas")).status_code == 403

        # Admin SÍ accede a ventas y ve el total cobrado
        token_admin = self.client.post(
            reverse("token-obtain-pair"),
            {"username": admin.username, "password": "StrongPassword123!"},
            format="json",
        ).data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_admin}")

        ventas_res = self.client.get(reverse("pedidos-admin-ventas") + "?rango=hoy")
        assert ventas_res.status_code == 200
        assert ventas_res.data["ventas_totales"] == 26000
        assert ventas_res.data["ventas_cobradas"] == 26000
        assert ventas_res.data["total_pedidos"] == 1

