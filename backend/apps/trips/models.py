import uuid
from django.db import models
from apps.fleet.models import Bus, Chauffeur
from people.models import Client


class Trip(models.Model):
    STATUS = [
        ("DRAFT", "Draft"),
        ("OPEN", "Open"),
        ("CLOSED", "Closed"),
        ("CANCELLED", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip_date = models.DateField()
    origin = models.CharField(max_length=120)
    destination = models.CharField(max_length=120)
    departure_time = models.TimeField(null=True, blank=True)
    return_time = models.TimeField(null=True, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    bus = models.ForeignKey(Bus, on_delete=models.PROTECT, related_name="trips")
    chauffeur = models.ForeignKey(Chauffeur, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=10, choices=STATUS, default="DRAFT")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        creating = self._state.adding
        super().save(*args, **kwargs)
        if creating:
            from apps.trips.models import TripSeat  # local import
            capacity = self.bus.bus_type.seats_count
            TripSeat.objects.bulk_create(
                [TripSeat(trip=self, seat_no=i) for i in range(1, capacity + 1)]
            )


class PickupPoint(models.Model):
    name = models.CharField(max_length=120)
    address = models.CharField(max_length=200, blank=True)
    time_hint = models.TimeField(null=True, blank=True)


class TripPickup(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="pickups")
    pickup_point = models.ForeignKey(PickupPoint, on_delete=models.PROTECT)
    pickup_time = models.TimeField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)


class TripSeat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="seats")
    seat_no = models.PositiveIntegerField()
    blocked = models.BooleanField(default=False)
    note = models.CharField(max_length=120, blank=True)

    class Meta:
        unique_together = ("trip", "seat_no")
        ordering = ["seat_no"]
        indexes = [models.Index(fields=["trip", "seat_no"])]


class Reservation(models.Model):
    STATUS = [
        ("HOLD", "Hold"),
        ("TENTATIVE", "Tentative"),
        ("CONFIRMED", "Confirmed"),
        ("CANCELLED", "Cancelled"),
        ("NO_SHOW", "No show"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip_seat = models.ForeignKey(TripSeat, on_delete=models.CASCADE, related_name="reservations")
    client = models.ForeignKey(Client, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=10, choices=STATUS, default="HOLD")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["trip_seat"]
