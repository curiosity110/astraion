import uuid
from django.db import models


class BusType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=80)
    seats_count = models.PositiveIntegerField()
    seat_map = models.JSONField(default=dict, blank=True)  # optional visual mapping

    class Meta:
        ordering = ["name"]
        verbose_name = "Bus Type"
        verbose_name_plural = "Bus Types"

    def __str__(self):
        return f"{self.name} ({self.seats_count} seats)"


class Bus(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plate = models.CharField(max_length=20, unique=True)
    label = models.CharField(max_length=80, blank=True)
    bus_type = models.ForeignKey(BusType, on_delete=models.PROTECT, related_name="buses")
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["plate"]
        indexes = [
            models.Index(fields=["bus_type", "active"]),
        ]

    def __str__(self):
        return f"{self.plate} ({self.label or self.bus_type.name})"


class Chauffeur(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=40, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
