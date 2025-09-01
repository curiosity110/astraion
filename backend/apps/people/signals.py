from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Client

channel_layer = get_channel_layer()

def push(payload):
    async_to_sync(channel_layer.group_send)("clients", {"type": "broadcast", "data": payload})


def push_dashboard(payload):
    async_to_sync(channel_layer.group_send)("dashboard", {"type": "broadcast", "data": payload})

@receiver(post_save, sender=Client)
def client_changed(sender, instance, **kwargs):
    payload = {"type": "client.updated", "client_id": str(instance.id)}
    push(payload)
    push_dashboard({"type": "data.changed"})
