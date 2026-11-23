from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.pedidos.models import Pedido
from apps.pedidos.serializers import (
    PanelPedidoSerializer,
    PublicPedidoTrackingSerializer,
)


def _group_name_for_order(codigo: str) -> str:
    safe = "".join(ch for ch in codigo.upper() if ch.isalnum() or ch in "-_")
    return f"pedido_{safe}"


def emitir_evento_pedido(pedido: Pedido, evento: str = "pedido_actualizado") -> None:
    """
    Emite actualización en tiempo real al panel de mesera/admin (datos completos)
    y al canal individual de seguimiento del cliente (solo datos mínimos públicos).
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    pedido_full = (
        Pedido.objects.select_related("mesa", "pago")
        .prefetch_related("items")
        .get(pk=pedido.pk)
    )

    panel_data = PanelPedidoSerializer(pedido_full).data
    public_data = PublicPedidoTrackingSerializer(pedido_full).data

    async_to_sync(channel_layer.group_send)(
        "panel_pedidos",
        {
            "type": "order.event",
            "event": evento,
            "pedido": panel_data,
        },
    )

    async_to_sync(channel_layer.group_send)(
        _group_name_for_order(pedido_full.codigo),
        {
            "type": "tracking.event",
            "event": evento,
            "pedido": public_data,
        },
    )
