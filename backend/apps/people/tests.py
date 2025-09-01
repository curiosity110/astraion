from django.urls import reverse
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from datetime import date
from apps.fleet.models import BusType, Bus
from apps.trips.models import Trip, Reservation, SeatAssignment
from .models import Client

class TestClientPhone(APITestCase):
    def test_relaxed_phone(self):
        url = reverse("client-list")
        data = {"first_name": "Foo", "last_name": "Bar", "phones": [{"e164": "notaphone"}]}
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, 201)
        client = Client.objects.get(first_name="Foo")
        self.assertEqual(client.phones.first().e164, "notaphone")


class TestClientHistory(APITestCase):
    def setUp(self):
        bt = BusType.objects.create(name="Mini", seats_count=2)
        bus = Bus.objects.create(plate="B4", bus_type=bt)
        self.trip = Trip.objects.create(trip_date=date.today(), origin="A", destination="B", bus=bus)
        self.user = get_user_model().objects.create_user("uh", password="p")
        self.client.force_authenticate(self.user)
        self.client_rec = Client.objects.create(first_name="Hist", last_name="Client")
        self.reservation = Reservation.objects.create(
            trip=self.trip,
            contact_client=self.client_rec,
            quantity=1,
            status="CONFIRMED",
            created_by=self.user,
            updated_by=self.user,
        )
        SeatAssignment.objects.create(
            trip=self.trip,
            seat_no=1,
            reservation=self.reservation,
            passenger_client=self.client_rec,
            first_name="Hist",
            last_name="Client",
            status="CONFIRMED",
        )

    def test_history_endpoint(self):
        url = reverse("client-history", args=[self.client_rec.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data["trips"]), 1)
        entry = resp.data["trips"][0]
        self.assertEqual(entry["seat_no"], 1)
        self.assertEqual(entry["status"], "CONFIRMED")
