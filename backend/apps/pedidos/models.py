import secrets

from django.conf import settings
from django.db import models

from apps.menu.models import Adicional, Producto
from apps.mesas.models import Mesa

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_order_code() -> str:
    """Genera un código aleatorio criptográficamente seguro y fácil de leer."""
    token = "".join(secrets.choice(CODE_ALPHABET) for _ in range(8))
    return f"VC-{token[:4]}-{token[4:]}"


class Pedido(models.Model):
    class Tipo(models.TextChoices):
        MESA = "mesa", "En mesa"
        RECOGER = "recoger", "Para recoger"
        DOMICILIO = "domicilio", "Domicilio"

    class Estado(models.TextChoices):
        NUEVO = "nuevo", "Nuevo"
        PREPARANDO = "preparando", "Preparando"
        LISTO = "listo", "Listo"
        ENTREGADO = "entregado", "Entregado"
        CANCELADO = "cancelado", "Cancelado"

    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        default=generate_order_code,
    )
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.NUEVO,
        db_index=True,
    )
    mesa = models.ForeignKey(
        Mesa,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pedidos",
    )
    mesa_referencia = models.CharField(max_length=40, blank=True)
    cliente_nombre = models.CharField(max_length=120)
    telefono = models.CharField(max_length=30, blank=True)
    direccion = models.CharField(max_length=240, blank=True)
    notas = models.TextField(blank=True)
    # Dinero siempre en enteros COP recalculados en backend
    total = models.PositiveIntegerField(default=0)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pedidos_creados",
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-creado_en",)
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"

    @property
    def mesa_display(self) -> str:
        if self.mesa:
            return str(self.mesa)
        if self.mesa_referencia:
            return (
                self.mesa_referencia
                if self.mesa_referencia.lower().startswith("mesa")
                else f"Mesa {self.mesa_referencia}"
            )
        return ""

    def __str__(self):
        return f"{self.codigo} · {self.get_estado_display()} (${self.total:,})"


class ItemPedido(models.Model):
    class Tamano(models.TextChoices):
        NORMAL = "normal", "Normal"
        MINI = "mini", "MINI"

    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name="items",
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.SET_NULL,
        null=True,
        related_name="items_pedido",
    )
    nombre_producto = models.CharField(max_length=140)
    tamano = models.CharField(
        max_length=10,
        choices=Tamano.choices,
        default=Tamano.NORMAL,
    )
    cantidad = models.PositiveIntegerField(default=1)
    # Snapshots enteros en COP al momento de ordenar
    precio_unitario = models.PositiveIntegerField()
    adicionales = models.ManyToManyField(Adicional, blank=True)
    adicionales_snapshot = models.JSONField(default=list, blank=True)
    subtotal = models.PositiveIntegerField()
    notas = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ("id",)
        verbose_name = "Ítem de Pedido"
        verbose_name_plural = "Ítems de Pedido"

    def __str__(self):
        return f"{self.cantidad}x {self.nombre_producto} ({self.tamano})"
