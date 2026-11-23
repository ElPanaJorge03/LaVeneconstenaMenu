from django.urls import re_path

from apps.local.consumers import HealthConsumer
from apps.pedidos.consumers import PanelPedidosConsumer, SeguimientoPedidoConsumer

websocket_urlpatterns = [
    re_path(r"^ws/health/$", HealthConsumer.as_asgi()),
    re_path(r"^ws/pedidos/panel/$", PanelPedidosConsumer.as_asgi()),
    re_path(
        r"^ws/pedidos/seguimiento/(?P<codigo>[A-Za-z0-9\-_]+)/$",
        SeguimientoPedidoConsumer.as_asgi(),
    ),
]
