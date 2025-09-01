from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from apps.people.models import Client
from apps.trips.models import Trip, Reservation, TripSeat, SeatAssignment
from apps.people.serializers import ClientSerializer
from apps.trips.serializers import TripSerializer

@api_view(["GET"])
def summary(request):
    today = timezone.localdate()
    total_clients = Client.objects.count()
    total_trips = Trip.objects.count()
    active_reservations = Reservation.objects.exclude(status="CANCELLED").count()
    seats_available_today = 0
    for trip in Trip.objects.filter(trip_date=today):
        total_seats = TripSeat.objects.filter(trip=trip, blocked=False).count()
        booked = SeatAssignment.objects.filter(trip=trip).count()
        seats_available_today += max(total_seats - booked, 0)
    data = {
        "total_clients": total_clients,
        "total_trips": total_trips,
        "active_reservations": active_reservations,
        "seats_available_today": seats_available_today,
    }
    return Response(data)

@api_view(["GET"])
def upcoming_trips(request):
    today = timezone.localdate()
    end = today + timedelta(days=7)
    trips = Trip.objects.filter(trip_date__range=(today, end)).order_by("trip_date")
    data = TripSerializer(trips, many=True, context={"request": request}).data
    return Response({"trips": data})

@api_view(["GET"])
def recent_clients(request):
    limit = int(request.query_params.get("limit", 5))
    clients = Client.objects.order_by("-updated_at")[:limit]
    data = ClientSerializer(clients, many=True, context={"request": request}).data
    return Response({"clients": data})
