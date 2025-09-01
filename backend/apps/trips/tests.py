import csv
from datetime import date
from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.fleet.models import BusType, Bus
from apps.people.models import Client
from .models import Trip, TripSeat, SeatAssignment, Reservation

class TestTripSeats(TestCase):
    def setUp(self):
        bt = BusType.objects.create(name="Mini", seats_count=4)
        bus = Bus.objects.create(plate="B1", bus_type=bt)
        self.trip = Trip.objects.create(trip_date=date.today(), origin="A", destination="B", bus=bus)

    def test_seats_created_and_unique(self):
        self.assertEqual(TripSeat.objects.filter(trip=self.trip).count(), 4)
        with self.assertRaises(Exception):
            TripSeat.objects.create(trip=self.trip, seat_no=1)


class TestReservationFlow(TestCase):
    def setUp(self):
        bt = BusType.objects.create(name="Mini", seats_count=4)
        bus = Bus.objects.create(plate="B2", bus_type=bt)
        self.trip = Trip.objects.create(trip_date=date.today(), origin="A", destination="B", bus=bus)
        self.contact = Client.objects.create(first_name="Contact", last_name="P")
        self.user = get_user_model().objects.create_user("u", password="p")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_reserve_adjust_cancel_overbook(self):
        url = reverse("trip-reserve", args=[self.trip.id])
        r = self.client.post(url, {"quantity": 2, "contact_client_id": str(self.contact.id)}, format="json")
        self.assertEqual(r.status_code, 201)
        reservation_id = r.data["reservation_id"]
        self.assertEqual(len(r.data["assigned_seats"]), 2)

        # increase quantity
        url_res = reverse("reservation-detail", args=[reservation_id])
        r = self.client.patch(url_res, {"quantity": 3}, format="json")
        self.assertEqual(len(r.data["assigned_seats"]), 3)

        # move seat
        assign = SeatAssignment.objects.get(reservation_id=reservation_id, seat_no=3)
        url_assign = reverse("assignment-detail", args=[assign.id])
        r = self.client.patch(url_assign, {"seat_no": 4}, format="json")
        self.assertEqual(r.data["seat_no"], 4)

        # reduce quantity
        r = self.client.patch(url_res, {"quantity": 2}, format="json")
        self.assertEqual(len(r.data["assigned_seats"]), 2)

        # cancel
        r = self.client.patch(url_res, {"status": "CANCELLED"}, format="json")
        self.assertEqual(SeatAssignment.objects.filter(reservation_id=reservation_id).count(), 0)

        # fill bus and test overbook
        r = self.client.post(url, {"quantity": 4}, format="json")
        self.assertEqual(r.status_code, 201)
        r2 = self.client.post(url, {"quantity": 1}, format="json")
        self.assertEqual(r2.status_code, 409)
        r3 = self.client.post(url, {"quantity": 1}, format="json", HTTP_X_MANAGER_OVERRIDE="true")
        self.assertEqual(r3.status_code, 201)


class TestManifest(TestCase):
    def setUp(self):
        bt = BusType.objects.create(name="Mini", seats_count=2)
        bus = Bus.objects.create(plate="B3", bus_type=bt)
        self.trip = Trip.objects.create(trip_date=date.today(), origin="A", destination="B", bus=bus)
        self.user = get_user_model().objects.create_user("u2", password="p")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        contact = Client.objects.create(first_name="A", last_name="B")
        url = reverse("trip-reserve", args=[self.trip.id])
        self.client.post(url, {"quantity":1, "contact_client_id": str(contact.id)}, format="json")

    def test_manifest_rows(self):
        url = reverse("export_manifest", args=[self.trip.id])
        resp = self.client.get(url)
        lines = resp.content.decode().strip().splitlines()
        self.assertEqual(len(lines)-1, 2)
