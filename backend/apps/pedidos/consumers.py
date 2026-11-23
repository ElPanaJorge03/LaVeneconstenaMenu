from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from .realtime import _group_name_for_order

User = get_user_model()


@database_sync_to_async
def _get_authorized_staff(token_str: str):
    if not token_str:
        return None
    try:
        token = AccessToken(token_str)
        user_id = token.get("user_id")
        user = User.objects.get(pk=user_id, is_active=True)
        if user.is_admin_role or user.is_mesera_role:
            return user
    except (TokenError, User.DoesNotExist, ValueError):
        return None
    return None


class PanelPedidosConsumer(AsyncJsonWebsocketConsumer):
    """Canal WebSocket en tiempo real para el panel de mesera/admin (requiere JWT válido)."""

    async def connect(self):
        query_params = parse_qs(self.scope.get("query_string", b"").decode("utf-8"))
        token_list = query_params.get("token", [])
        token_str = token_list[0] if token_list else ""

        user = await _get_authorized_staff(token_str)
        if not user:
            await self.close(code=4401)
            return

        self.user = user
        self.group_name = "panel_pedidos"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json(
            {"type": "connected", "channel": "panel_pedidos", "rol": user.rol}
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "ping":
            await self.send_json({"type": "pong"})

    async def order_event(self, event):
        await self.send_json(
            {
                "type": event["event"],
                "pedido": event["pedido"],
            }
        )


class SeguimientoPedidoConsumer(AsyncJsonWebsocketConsumer):
    """Canal WebSocket público por código de seguimiento (solo expone datos mínimos)."""

    async def connect(self):
        codigo = self.scope["url_route"]["kwargs"].get("codigo", "").strip().upper()
        if not codigo or len(codigo) < 6:
            await self.close(code=4400)
            return

        self.group_name = _group_name_for_order(codigo)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({"type": "connected", "codigo": codigo})

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "ping":
            await self.send_json({"type": "pong"})

    async def tracking_event(self, event):
        await self.send_json(
            {
                "type": event["event"],
                "pedido": event["pedido"],
            }
        )
