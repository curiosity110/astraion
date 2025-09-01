# # apps/trips/views.py
from django.http import HttpResponse, Http404
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
import csv
from rest_framework.decorators import action
from rest_framework import viewsets, status
from rest_framework.response import Response

import csv
from .serializers import TripSerializer, ReservationSerializer, SeatAssignmentSerializer
from .models import Trip, TripSeat, SeatAssignment, Reservation
from apps.people.models import Client


def export_manifest(request, trip_id):
    trip = get_object_or_404(Trip, pk=trip_id)

    response = HttpResponse(content_type="text/csv")
    response[
        "Content-Disposition"
    ] = f'attachment; filename=manifest_{trip.trip_date}_{trip.destination}_{trip.id}.csv'

    writer = csv.writer(response)
    writer.writerow(["Seat", "FirstName", "LastName", "Phone", "PassportID", "Pickup", "Status"])

    assignments = {
        a.seat_no: a
        for a in (
            SeatAssignment.objects.filter(trip=trip)
            .select_related("passenger_client")
            .prefetch_related("passenger_client__phones")
        )
    }

    for seat in TripSeat.objects.filter(trip=trip).order_by("seat_no"):
        a = assignments.get(seat.seat_no)
        if a:
            client = a.passenger_client
            fn = a.first_name or (client.first_name if client else "") or ""
            ln = a.last_name or (client.last_name if client else "") or ""
            phone = a.phone or (
                (client.phones.filter(is_primary=True).first() or client.phones.first()).e164
                if client and client.phones.exists()
                else ""
            )
            passport = a.passport_id or (client.passport_id if client else "") or ""
            status = a.status
        else:
            fn = ln = phone = passport = status = ""

        writer.writerow([seat.seat_no, fn, ln, phone, passport, "", status])

    return response


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all().order_by("-trip_date")
    serializer_class = TripSerializer

    @action(detail=True, methods=["get"], url_path="seats", url_name="seats")
    def seats(self, request, pk=None):
        trip = self.get_object()
        assignments = SeatAssignment.objects.filter(trip=trip)
        data = SeatAssignmentSerializer(assignments, many=True).data
        return Response(data)

    @action(detail=True, methods=["post"], url_path="reserve", url_name="reserve")
    def reserve(self, request, pk=None):
        trip = self.get_object()
        quantity = int(request.data.get("quantity", 0))
        if quantity <= 0:
            return Response({"detail": "quantity required"}, status=status.HTTP_400_BAD_REQUEST)
        contact_id = request.data.get("contact_client_id")
        notes = request.data.get("notes", "")
        contact = None
        if contact_id:
            contact = get_object_or_404(Client, pk=contact_id)
        reservation = Reservation.objects.create(
            trip=trip,
            contact_client=contact,
            quantity=quantity,
            notes=notes,
            created_by=request.user,
            updated_by=request.user,
        )
        reservation.allocate_seats()
        assigned = list(
            SeatAssignment.objects.filter(reservation=reservation).values_list("seat_no", flat=True)
        )
        free_count = TripSeat.objects.filter(trip=trip, blocked=False).count() - len(
            SeatAssignment.objects.filter(trip=trip)
        )
        if len(assigned) < quantity and request.headers.get("X-Manager-Override", "false").lower() != "true":
            reservation.delete()
            return Response({"detail": "not enough seats"}, status=status.HTTP_409_CONFLICT)
        return Response({"reservation_id": str(reservation.id), "assigned_seats": assigned}, status=status.HTTP_201_CREATED)


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    http_method_names = ["patch", "get"]

    def partial_update(self, request, *args, **kwargs):
        reservation = self.get_object()
        data = request.data
        if "contact_client_id" in data:
            reservation.contact_client = get_object_or_404(Client, pk=data["contact_client_id"]) if data["contact_client_id"] else None
        if "notes" in data:
            reservation.notes = data["notes"]
        if "status" in data:
            reservation.status = data["status"]
            if reservation.status == "CANCELLED":
                SeatAssignment.objects.filter(reservation=reservation).delete()
        if "quantity" in data:
            new_q = int(data["quantity"])
            if new_q < 0:
                return Response({"detail": "quantity invalid"}, status=status.HTTP_400_BAD_REQUEST)
            reservation.quantity = new_q
            current = SeatAssignment.objects.filter(reservation=reservation)
            diff = new_q - current.count()
            if diff > 0:
                reservation.allocate_seats()
                if SeatAssignment.objects.filter(reservation=reservation).count() < new_q and request.headers.get("X-Manager-Override", "false").lower() != "true":
                    return Response({"detail": "not enough seats"}, status=status.HTTP_409_CONFLICT)
            elif diff < 0:
                for sa in current.order_by("-seat_no")[: -diff]:
                    sa.delete()
        reservation.updated_by = request.user
        reservation.save()
        assigned = list(
            SeatAssignment.objects.filter(reservation=reservation).values_list("seat_no", flat=True)
        )
        return Response({"reservation_id": str(reservation.id), "assigned_seats": assigned})


class SeatAssignmentViewSet(viewsets.ModelViewSet):
    queryset = SeatAssignment.objects.all()
    serializer_class = SeatAssignmentSerializer
    http_method_names = ["patch", "get"]

    def partial_update(self, request, *args, **kwargs):
        assignment = self.get_object()
        data = request.data
        if "seat_no" in data:
            new_seat = int(data["seat_no"])
            if SeatAssignment.objects.filter(trip=assignment.trip, seat_no=new_seat).exclude(id=assignment.id).exists():
                return Response({"detail": "seat taken"}, status=status.HTTP_409_CONFLICT)
            if not TripSeat.objects.filter(trip=assignment.trip, seat_no=new_seat, blocked=False).exists():
                return Response({"detail": "seat invalid"}, status=status.HTTP_400_BAD_REQUEST)
            assignment.seat_no = new_seat
        if "passenger_client_id" in data:
            assignment.passenger_client = get_object_or_404(Client, pk=data["passenger_client_id"]) if data["passenger_client_id"] else None
        for field in ["first_name", "last_name", "phone", "passport_id", "status"]:
            if field in data:
                setattr(assignment, field, data[field])
        assignment.save()
        return Response(SeatAssignmentSerializer(assignment).data)
