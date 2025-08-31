from rest_framework import serializers
from django.urls import reverse
from django.conf import settings
from .models import Trip

class TripSerializer(serializers.ModelSerializer):
    links = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = ("id","trip_date","origin","destination","departure_time",
                  "return_time","price","status","notes","links")

    def get_links(self, obj):
        req = self.context.get("request")
        ui = settings.FRONTEND_BASE_URL
        def abs_url(name, *args, **kwargs):
            return req.build_absolute_uri(reverse(name, args=args, kwargs=kwargs)) if req else ""
        return {
            "api.self": abs_url("trip-detail", obj.id),
            "api.seats": abs_url("trip-seats", obj.id),
            "api.reserve": abs_url("trip-reserve", obj.id),
            "api.manifest.csv": abs_url("export_manifest", obj.id),
            "ui.self": f"{ui}/trips/{obj.id}",
            "ui.manifest": f"{ui}/trips/{obj.id}?action=download-manifest",
        }
