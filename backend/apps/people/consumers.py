from channels.generic.websocket import AsyncJsonWebsocketConsumer

class ClientConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.group_name = "clients"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        return

    async def broadcast(self, event):
        data = event.get("data", {})
        await self.send_json(data)
