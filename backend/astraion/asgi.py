import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from apps.trips.consumers import TripConsumer


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "astraion.settings")


django_asgi_app = get_asgi_application()


application = ProtocolTypeRouter({
"http": django_asgi_app,
"websocket": URLRouter([
path("ws/trips/<uuid:trip_id>/", TripConsumer.as_asgi()),
]),
})