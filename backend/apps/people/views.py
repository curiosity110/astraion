from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
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
