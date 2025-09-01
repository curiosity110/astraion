# # apps/trips/views.py
from django.http import HttpResponse, Http404
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
import csv
import json
from rest_framework.decorators import action
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .serializers import TripSerializer, ReservationSerializer, SeatAssignmentSerializer
from .models import Trip, TripSeat, SeatAssignment, Reservation
from apps.people.models import Client
from .signals import push, push_dashboard


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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["destination"]
    filterset_fields = ["trip_date", "status"]

    def get_queryset(self):
        qs = super().get_queryset()
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from and date_to:
            qs = qs.filter(trip_date__range=[date_from, date_to])
        elif date_from:
            qs = qs.filter(trip_date__gte=date_from)
        elif date_to:
            qs = qs.filter(trip_date__lte=date_to)
        dest = self.request.query_params.get("destination")
        if dest:
            qs = qs.filter(destination__icontains=dest)
        return qs

    def destroy(self, request, *args, **kwargs):
        trip = self.get_object()
        if trip.reservations.exclude(status="CANCELLED").exists():
            return Response({"detail": "trip has active reservations"}, status=409)
        trip.delete()
        return Response(status=204)

    @action(detail=True, methods=["get"], url_path="seats", url_name="seats")
    def seats(self, request, pk=None):
        trip = self.get_object()
        assignments = SeatAssignment.objects.filter(trip=trip)
        data = SeatAssignmentSerializer(assignments, many=True).data
        return Response(data)

    @action(detail=False, methods=["get"], url_path="export", url_name="export")
    def export(self, request):
        fmt = request.query_params.get("format", "json")
        qs = self.get_queryset()
        if fmt == "csv":
            resp = HttpResponse(content_type="text/csv")
            resp["Content-Disposition"] = "attachment; filename=trips.csv"
            writer = csv.writer(resp)
            writer.writerow(["ID", "Date", "Origin", "Destination"])
            for t in qs:
                writer.writerow([t.id, t.trip_date, t.origin, t.destination])
            return resp
        data = TripSerializer(qs, many=True, context={"request": request}).data
        if fmt == "json":
            resp = HttpResponse(json.dumps(data, default=str), content_type="application/json")
            resp["Content-Disposition"] = "attachment; filename=trips.json"
            return resp
        return Response(data)

    @action(detail=False, methods=["post"], url_path="import", url_name="import")
    def import_csv(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "file required"}, status=400)
        decoded = file.read().decode()
        reader = csv.DictReader(decoded.splitlines())
        created = 0
        for row in reader:
            Trip.objects.create(
                destination=row.get("destination", ""),
                trip_date=row.get("trip_date"),
                origin=row.get("origin", ""),
                bus_id=row.get("bus"),
            )
            created += 1
        if created:
            push_dashboard({"type": "data.changed"})
        return Response({"created": created})

    @action(detail=False, methods=["post"], url_path="bulk", url_name="bulk")
    def bulk(self, request):
        ids = request.data.get("ids", [])
        action = request.data.get("action")
        qs = Trip.objects.filter(id__in=ids)
        if action == "cancel":
            count = qs.update(status="CANCELLED")
            for tid in ids:
                push(tid, {"type": "trip.cancelled", "trip_id": tid})
            push_dashboard({"type": "data.changed"})
            return Response({"processed": count})
        elif action == "export_manifests":
            import io, zipfile
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, "w") as z:
                for trip in qs:
                    response = export_manifest(request, trip.id)
                    z.writestr(f"manifest_{trip.id}.csv", response.content.decode())
            resp = HttpResponse(buffer.getvalue(), content_type="application/zip")
            resp["Content-Disposition"] = "attachment; filename=manifests.zip"
            return resp
        else:
            return Response({"detail": "invalid action"}, status=400)

    @action(detail=True, methods=["get"], url_path="report", url_name="report")
    def report(self, request, pk=None):
        trip = self.get_object()
        total = TripSeat.objects.filter(trip=trip).count()
        booked = SeatAssignment.objects.filter(trip=trip).count()
        available = TripSeat.objects.filter(trip=trip, blocked=False).count() - booked
        cancellations = Reservation.objects.filter(trip=trip, status="CANCELLED").count()
        stats = {
            "total": total,
            "booked": booked,
            "available": available,
            "cancellations": cancellations,
        }
        manifest = SeatAssignmentSerializer(
            SeatAssignment.objects.filter(trip=trip), many=True
        ).data
        data = {"stats": stats, "manifest": manifest}
        if request.query_params.get("format") == "json":
            resp = HttpResponse(
                json.dumps(data, default=str), content_type="application/json"
            )
            resp["Content-Disposition"] = (
                f"attachment; filename=trip_{trip.id}_report.json"
            )
            return resp
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

    def get_queryset(self):
        qs = super().get_queryset()
        contact_client = self.request.query_params.get("contact_client")
        trip = self.request.query_params.get("trip")
        if contact_client:
            qs = qs.filter(contact_client_id=contact_client)
        if trip:
            qs = qs.filter(trip_id=trip)
        return qs

    @action(detail=False, methods=["post"], url_path="bulk", url_name="bulk")
    def bulk(self, request):
        ids = request.data.get("ids", [])
        action = request.data.get("action")
        if action != "cancel":
            return Response({"detail": "invalid action"}, status=400)
        count = 0
        for r in Reservation.objects.filter(id__in=ids):
            r.status = "CANCELLED"
            r.save()
            SeatAssignment.objects.filter(reservation=r).delete()
            count += 1
        return Response({"processed": count})

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
