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


class TestTripReport(TestCase):
    def setUp(self):
        bt = BusType.objects.create(name="Mini", seats_count=3)
        bus = Bus.objects.create(plate="B5", bus_type=bt)
        self.trip = Trip.objects.create(trip_date=date.today(), origin="A", destination="B", bus=bus)
        self.user = get_user_model().objects.create_user("ur", password="p")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.contact = Client.objects.create(first_name="R", last_name="P")
        url = reverse("trip-reserve", args=[self.trip.id])
        self.client.post(url, {"quantity": 2, "contact_client_id": str(self.contact.id)}, format="json")
        self.reservation = Reservation.objects.filter(contact_client=self.contact).first()

    def test_report_stats(self):
        url = reverse("trip-report", args=[self.trip.id])
        resp = self.client.get(url)
        self.assertEqual(resp.data["stats"]["total"], 3)
        self.assertEqual(resp.data["stats"]["booked"], 2)
        self.assertEqual(resp.data["stats"]["available"], 1)
        self.assertEqual(resp.data["stats"]["cancellations"], 0)
        self.assertEqual(len(resp.data["manifest"]), 2)

        res_url = reverse("reservation-detail", args=[self.reservation.id])
        self.client.patch(res_url, {"status": "CANCELLED"}, format="json")
        resp2 = self.client.get(url)
        self.assertEqual(resp2.data["stats"]["booked"], 0)
        self.assertEqual(resp2.data["stats"]["cancellations"], 1)


class TestTripCRUD(TestCase):
    def setUp(self):
        bt = BusType.objects.create(name="Mini", seats_count=2)
        self.bus = Bus.objects.create(plate="B9", bus_type=bt)
        self.user = get_user_model().objects.create_user("tc", password="p")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_create_update_delete(self):
        url = reverse("trip-list")
        data = {
            "trip_date": str(date.today()),
            "origin": "A",
            "destination": "B",
            "bus": str(self.bus.id),
        }
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, 201)
        tid = resp.data["id"]

        detail = reverse("trip-detail", args=[tid])
        resp = self.client.patch(detail, {"destination": "C"}, format="json")
        self.assertEqual(resp.status_code, 200)

        resp = self.client.delete(detail)
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Trip.objects.filter(id=tid).exists())

    def test_delete_blocked_with_reservations(self):
        url = reverse("trip-list")
        resp = self.client.post(
            url,
            {
                "trip_date": str(date.today()),
                "origin": "A",
                "destination": "B",
                "bus": str(self.bus.id),
            },
            format="json",
        )
        tid = resp.data["id"]
        contact = Client.objects.create(first_name="C", last_name="L")
        res_url = reverse("trip-reserve", args=[tid])
        self.client.post(res_url, {"quantity": 1, "contact_client_id": str(contact.id)}, format="json")
        detail = reverse("trip-detail", args=[tid])
        resp = self.client.delete(detail)
        self.assertEqual(resp.status_code, 409)
