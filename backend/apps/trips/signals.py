from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from .models import SeatAssignment, Reservation


channel_layer = get_channel_layer()


def push(trip_id, payload):
    async_to_sync(channel_layer.group_send)(f"trip_{trip_id}", {"type": "broadcast", "data": payload})


def push_clients(payload):
    async_to_sync(channel_layer.group_send)("clients", {"type": "broadcast", "data": payload})


def push_dashboard(payload):
    async_to_sync(channel_layer.group_send)("dashboard", {"type": "broadcast", "data": payload})


@receiver(post_save, sender=SeatAssignment)
def seat_assigned(sender, instance, **kwargs):
    push(instance.trip_id, {"type": "seat.assigned", "seat_no": instance.seat_no})


@receiver(post_delete, sender=SeatAssignment)
def seat_released(sender, instance, **kwargs):
    push(instance.trip_id, {"type": "seat.released", "seat_no": instance.seat_no})


@receiver(pre_save, sender=SeatAssignment)
def seat_moved(sender, instance, **kwargs):
    if instance.pk:
        prev = SeatAssignment.objects.get(pk=instance.pk)
        if prev.seat_no != instance.seat_no:
            push(instance.trip_id, {"type": "seat.released", "seat_no": prev.seat_no})


@receiver(post_save, sender=Reservation)
def reservation_changed(sender, instance, **kwargs):
    push(instance.trip_id, {"type": "reservation.updated", "reservation_id": str(instance.id)})
    client_ids = []
    if instance.contact_client_id:
        client_ids.append(str(instance.contact_client_id))
    client_ids += list(
        instance.assignments.filter(passenger_client_id__isnull=False).values_list(
            "passenger_client_id", flat=True
        )
    )
    if client_ids:
        push_clients({
            "type": "reservation.updated",
            "reservation_id": str(instance.id),
            "client_ids": [str(cid) for cid in set(client_ids)],
        })
    push_dashboard({"type": "data.changed"})
