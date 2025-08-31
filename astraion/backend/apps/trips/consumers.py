import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class TripConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.trip_id = self.scope["url_route"]["kwargs"]["trip_id"]
        self.group_name = f"trip_{self.trip_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_channel)

    async def receive_json(self, content, **kwargs):
        # MVP: client cannot send messages, only receive updates
        return

    async def broadcast(self, event):
        """Handle messages broadcast via Django signals -> group_send."""
        data = event.get("data", {})
        await self.send_json(data)
