from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import TripSeat, Reservation


def push(trip_id, payload: dict):
    """
    Send a JSON-serializable payload to all WebSocket consumers
    subscribed to the given trip group.
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"trip_{trip_id}",
        {"type": "broadcast", "data": payload},
    )


@receiver(post_save, sender=TripSeat)
@receiver(post_delete, sender=TripSeat)
def trip_seat_changed(sender, instance, **kwargs):
    push(
        instance.trip_id,
        {
            "event": "seat.updated",
            "seat_no": instance.seat_no,
            "blocked": instance.blocked,
        },
    )


@receiver(post_save, sender=Reservation)
@receiver(post_delete, sender=Reservation)
def reservation_changed(sender, instance, **kwargs):
    # Assuming Reservation links to TripSeat via FK
    trip_id = instance.trip_seat.trip_id
    push(
        trip_id,
        {
            "event": "reservation.updated",
            "reservation_id": str(instance.id),
            "status": instance.status,
        },
    )
