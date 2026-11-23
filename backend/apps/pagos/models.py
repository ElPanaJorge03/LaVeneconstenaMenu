from django.db import models

from apps.pedidos.models import Pedido


class Pago(models.Model):
    class Metodo(models.TextChoices):
        EFECTIVO = "efectivo", "Efectivo"
        BOLD = "bold", "Bold (Online)"

    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        PAGADO = "pagado", "Pagado"
        FALLIDO = "fallido", "Fallido"
        CANCELADO = "cancelado", "Cancelado"

    pedido = models.OneToOneField(
        Pedido,
        on_delete=models.CASCADE,
        related_name="pago",
    )
    metodo = models.CharField(
        max_length=20,
        choices=Metodo.choices,
        default=Metodo.EFECTIVO,
    )
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )
    monto = models.PositiveIntegerField(default=0)
    referencia_bold = models.CharField(max_length=120, blank=True, db_index=True)
    pagado_en = models.DateTimeField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"

    def __str__(self):
        return f"Pago {self.pedido.codigo} · {self.metodo} · {self.estado}"
