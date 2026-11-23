from django.contrib import admin

from .models import ItemPedido, Pedido


class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 0
    readonly_fields = ("nombre_producto", "tamano", "cantidad", "precio_unitario", "subtotal")


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ("codigo", "tipo", "estado", "cliente_nombre", "total", "creado_en")
    list_filter = ("tipo", "estado")
    search_fields = ("codigo", "cliente_nombre", "telefono")
    inlines = [ItemPedidoInline]
