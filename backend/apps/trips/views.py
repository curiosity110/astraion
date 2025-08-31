# # apps/trips/views.py
# from django.http import HttpResponse, Http404
# from rest_framework.decorators import api_view
# from django.shortcuts import get_object_or_404
# from django.db.models import Prefetch
# import csv

from django.http import HttpResponse
from .serializers import TripSerializer
from .models import Trip, TripSeat, SeatAssignment


def export_manifest(request, trip_id):
    return HttpResponse("Not implemented", status=501)


# @api_view(["GET"])
# def export_manifest(request, trip_id):
#     trip = get_object_or_404(Trip, pk=trip_id)

#     response = HttpResponse(content_type="text/csv")
#     response["Content-Disposition"] = (
#         f'attachment; filename=manifest_{trip.trip_date}_{trip.destination}_{trip.id}.csv'
#     )

#     writer = csv.writer(response)
#     writer.writerow(["Seat", "FirstName", "LastName", "Phone", "PassportID", "Pickup", "Status"])

#     # Pull all assignments for this trip and map by seat_no
#     assignments = {
#         a.seat_no: a
#         for a in (
#             SeatAssignment.objects.filter(trip=trip)
#             .select_related("passenger_client")
#             .prefetch_related("passenger_client__phones")
#         )
#     }

#     # Iterate over the canonical seats so we also output empty seats
#     for seat in TripSeat.objects.filter(trip=trip).order_by("seat_no"):
#         a = assignments.get(seat.seat_no)
#         if a:
#             # Prefer inline fields (entered before client is known); fall back to client
#             client = a.passenger_client
#             fn = a.first_name or (client.first_name if client else "") or ""
#             ln = a.last_name or (client.last_name if client else "") or ""
#             phone = a.phone or (
#                 (client.phones.filter(is_primary=True).first() or client.phones.first()).e164
#                 if client and client.phones.exists()
#                 else ""
#             )
#             passport = a.passport_id or (client.passport_id if client else "") or ""
#             status = a.status
#         else:
#             fn = ln = phone = passport = status = ""

#         writer.writerow([seat.seat_no, fn, ln, phone, passport, "", status])

#     return response

# backend/apps/trips/views.py (excerpt)
# backend/apps/trips/views.py (excerpt)
from rest_framework.decorators import action
from rest_framework import viewsets


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all().order_by("-trip_date")
    serializer_class = TripSerializer

    @action(detail=True, methods=["get"], url_path="seats", url_name="seats")
    def seats(self, request, pk=None): ...

    @action(detail=True, methods=["post"], url_path="reserve", url_name="reserve")
    def reserve(self, request, pk=None): ...
