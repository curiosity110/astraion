from django.urls import re_path
from apps.trips.consumers import TripConsumer
from apps.people.consumers import ClientConsumer

websocket_urlpatterns = [
    re_path(r"ws/trip/(?P<trip_id>[0-9a-f-]+)/$", TripConsumer.as_asgi()),
    re_path(r"ws/clients/$", ClientConsumer.as_asgi()),
]
