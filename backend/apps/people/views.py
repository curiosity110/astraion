from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
import csv
import json
from .models import Client, ClientNote, ActivityEvent
from .serializers import ClientSerializer, ClientNoteSerializer
from .signals import push
from rest_framework.decorators import api_view
from apps.trips.models import Reservation, SeatAssignment

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().prefetch_related("phones").order_by("last_name","first_name")
    serializer_class = ClientSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["birth_date", "nationality", "is_active", "created_at"]
    search_fields = ["first_name","last_name","passport_id","email","phones__e164"]

    def get_queryset(self):
        qs = super().get_queryset().distinct()
        tags_param = self.request.query_params.get("tags")
        if tags_param:
            tags = [t.strip() for t in tags_param.split(",") if t.strip()]
            for t in tags:
                qs = qs.filter(tags__contains=[t])
        return qs

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

    @action(detail=True, methods=["patch"], url_path="tags", url_name="tags")
    def set_tags(self, request, pk=None):
        client = self.get_object()
        tags = request.data.get("tags", [])
        if not isinstance(tags, list):
            return Response({"detail": "tags must be a list"}, status=400)
        client.tags = tags
        client.save()
        push({"type": "client.tagged", "client_id": str(client.id), "tags": client.tags})
        ActivityEvent.objects.create(event_type="client.tagged", client=client, data={"tags": client.tags})
        return Response({"tags": client.tags})

    @action(detail=True, methods=["get", "post"], url_path="notes", url_name="notes")
    def notes(self, request, pk=None):
        client = self.get_object()
        if request.method == "GET":
            notes = client.notes_list.all()
            return Response(ClientNoteSerializer(notes, many=True).data)
        serializer = ClientNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.save(client=client)
        data = ClientNoteSerializer(note).data
        push({"type": "client.note.added", "client_id": str(client.id), "note": data})
        ActivityEvent.objects.create(event_type="client.note.added", client=client, data=data)
        return Response(data, status=201)

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


@api_view(["GET"])
def activity_feed(request):
    events = ActivityEvent.objects.all()[:50]
    data = [
        {
            "id": str(e.id),
            "type": e.event_type,
            "client_id": str(e.client_id) if e.client_id else None,
            "data": e.data,
            "created_at": e.created_at,
        }
        for e in events
    ]
    return Response({"events": data})
