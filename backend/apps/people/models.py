import uuid
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    birth_date = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=80, blank=True)
    passport_id = models.CharField(max_length=64, blank=True, null=True)
    email = models.EmailField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["last_name", "first_name"])]
        ordering = ["last_name", "first_name"]
        # indexes = [models.Index(fields=["e164"])]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Phone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="phones")
    e164 = PhoneNumberField()
    label = models.CharField(max_length=30, blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["e164"])]
        unique_together = ("client", "e164")

    def __str__(self):
        return f"{self.label or 'Phone'}: {self.e164}"
