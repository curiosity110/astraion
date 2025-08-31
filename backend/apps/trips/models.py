import uuid
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from apps.fleet.models import Bus, Chauffeur
from apps.people.models import Client

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

    def __str__(self):
        return super().__str__() + f"{self.id} | {self.trip_date} | {self.origin} to {self.destination}"

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

    def __str__(self):
        return f"{self.name} {self.address} ({self.time_hint})"


class TripPickup(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="pickups")
    pickup_point = models.ForeignKey(PickupPoint, on_delete=models.PROTECT)
    pickup_time = models.TimeField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)


    def __str__(self):
        return (f"{self.id} | {self.trip} | {self.pickup_point} | {self.pickup_time} | {self.order}")


class TripSeat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="seats")
    seat_no = models.PositiveIntegerField()
    blocked = models.BooleanField(default=False)
    note = models.CharField(max_length=120, blank=True)

    def __str__(self):
        return f"{self.id} | {self.trip} | {self.seat_no} | {self.blocked}"

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
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="reservations")
    contact_client = models.ForeignKey(Client, null=True, blank=True, on_delete=models.SET_NULL)
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=12, choices=STATUS, default="HOLD")
    hold_expires_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_reservations")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="updated_reservations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    @transaction.atomic
    def allocate_seats(self):
        from django.db.models import Q
        from apps.trips.models import SeatAssignment, TripSeat
        taken = set(SeatAssignment.objects.filter(trip=self.trip).values_list("seat_no", flat=True))
        free = [s.seat_no for s in TripSeat.objects.filter(trip=self.trip, blocked=False).order_by("seat_no") if s.seat_no not in taken]
        need = self.quantity - SeatAssignment.objects.filter(reservation=self).count()
        for seat_no in free[:need]:
            SeatAssignment.objects.create(trip=self.trip, seat_no=seat_no, reservation=self)

    def __str__(self):
        return f"{self.id} | {self.trip_seat} | {self.client} | {self.status}"

    class Meta:
        ordering = ["trip_seat"]

class SeatAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="assignments")
    seat_no = models.PositiveIntegerField()
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name="assignments")
    passenger_client = models.ForeignKey(Client, null=True, blank=True, on_delete=models.SET_NULL, related_name="seat_assignments")
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    passport_id = models.CharField(max_length=64, blank=True)
    status = models.CharField(max_length=12, default="HOLD")


    class Meta:
        unique_together = ("trip", "seat_no")
        ordering = ["seat_no"]