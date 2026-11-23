from django.contrib import admin

from .models import Pago


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ("pedido", "metodo", "estado", "monto", "referencia_bold", "pagado_en")
    list_filter = ("metodo", "estado")
