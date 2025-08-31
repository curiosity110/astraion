from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import SeatAssignment, Reservation


channel_layer = get_channel_layer()


def push(trip_id, payload):
    async_to_sync(channel_layer.group_send)(f"trip_{trip_id}", {"type": "broadcast", "data": payload})


@receiver(post_save, sender=SeatAssignment)
@receiver(post_delete, sender=SeatAssignment)
def seat_assignment_changed(sender, instance, **kwargs):
    push(instance.trip_id, {"type": "seat.assignment", "seat_no": instance.seat_no})


@receiver(post_save, sender=Reservation)
def reservation_changed(sender, instance, **kwargs):
    push(instance.trip_id, {"type": "reservation.updated", "reservation_id": str(instance.id)})