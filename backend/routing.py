from django.urls import re_path
from apps.trips.consumers import TripConsumer

websocket_urlpatterns = [
    re_path(r"ws/trip/(?P<trip_id>[0-9a-f-]+)/$", TripConsumer.as_asgi()),
]
