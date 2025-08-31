# apps/trips/views.py
from django.http import HttpResponse
import csv
from rest_framework.decorators import api_view
from .models import Trip, TripSeat, Reservation


@api_view(["GET"])
def export_manifest(request, trip_id):
    trip = Trip.objects.get(pk=trip_id)
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f"attachment; filename=manifest_{trip_id}.csv"

    writer = csv.writer(response)
    writer.writerow(["Seat", "FirstName", "LastName", "Phone", "PassportID", "Pickup", "Status"])

    # Prefetch reservations & clients
    seats = (
        TripSeat.objects.filter(trip=trip)
        .select_related()
        .prefetch_related("reservation_set__client")
        .order_by("seat_no")
    )

    for seat in seats:
        reservation = seat.reservation_set.first()  # MVP: assume max 1 per seat
        if reservation and reservation.client:
            client = reservation.client
            fn, ln = client.first_name, client.last_name
            phone = client.phones.first().e164 if client.phones.exists() else ""
            passport = client.passport_id or ""
            status = reservation.status
        else:
            fn = ln = phone = passport = status = ""

        writer.writerow([seat.seat_no, fn, ln, phone, passport, "", status])

    return response
