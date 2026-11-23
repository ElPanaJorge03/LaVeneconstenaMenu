from channels.generic.websocket import AsyncJsonWebsocketConsumer


class HealthConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send_json({"type": "connected", "service": "la-veneconstena-ws"})

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "ping":
            await self.send_json({"type": "pong"})
