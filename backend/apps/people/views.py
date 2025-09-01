from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
import csv
import json
from .models import Client
from .serializers import ClientSerializer
from apps.trips.models import Reservation, SeatAssignment

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().prefetch_related("phones").order_by("last_name","first_name")
    serializer_class = ClientSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["birth_date", "nationality", "is_active", "created_at"]
    search_fields = ["first_name","last_name","passport_id","email","phones__e164"]

    def get_queryset(self):
        return super().get_queryset().distinct()

    @action(detail=False, methods=["get"], url_path="export", url_name="export")
    def export(self, request):
        fmt = request.query_params.get("format", "json")
        qs = self.get_queryset()
        if fmt == "csv":
            resp = HttpResponse(content_type="text/csv")
            resp["Content-Disposition"] = "attachment; filename=clients.csv"
            writer = csv.writer(resp)
            writer.writerow(["ID", "FirstName", "LastName", "Passport", "Email"])
            for c in qs:
                writer.writerow([c.id, c.first_name, c.last_name, c.passport_id, c.email])
            return resp
        data = ClientSerializer(qs, many=True, context={"request": request}).data
        if fmt == "json":
            resp = HttpResponse(json.dumps(data, default=str), content_type="application/json")
            resp["Content-Disposition"] = "attachment; filename=clients.json"
            return resp
        return Response(data)

    @action(detail=True, methods=["get"], url_path="history", url_name="history")
    def history(self, request, pk=None):
        client = self.get_object()
        assignments = (
            SeatAssignment.objects.filter(
                Q(passenger_client=client) | Q(reservation__contact_client=client)
            )
            .select_related("trip", "reservation")
            .order_by("trip__trip_date")
        )
        trips = [
            {
                "id": str(a.trip.id),
                "date": a.trip.trip_date,
                "destination": a.trip.destination,
                "reservation_id": str(a.reservation_id),
                "seat_no": a.seat_no,
                "status": a.reservation.status,
            }
            for a in assignments
        ]
        assigned_res = {a.reservation_id for a in assignments}
        extras = (
            Reservation.objects.filter(contact_client=client)
            .exclude(id__in=assigned_res)
            .select_related("trip")
        )
        for r in extras:
            trips.append(
                {
                    "id": str(r.trip.id),
                    "date": r.trip.trip_date,
                    "destination": r.trip.destination,
                    "reservation_id": str(r.id),
                    "seat_no": None,
                    "status": r.status,
                }
            )
        return Response({"trips": trips})
