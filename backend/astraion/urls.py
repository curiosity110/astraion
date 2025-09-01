"""
URL configuration for astraion project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from apps.trips.views import export_manifest, TripViewSet, ReservationViewSet, SeatAssignmentViewSet
from django.http import HttpResponse
from rest_framework.routers import DefaultRouter
from apps.people.views import ClientViewSet
from apps.dashboard import views as dashboard_views

def health(_): return HttpResponse("ok")

router = DefaultRouter()
router.register(r"clients", ClientViewSet, basename="client")
router.register(r"trips", TripViewSet, basename="trip")
router.register(r"reservations", ReservationViewSet, basename="reservation")
router.register(r"assignments", SeatAssignmentViewSet, basename="assignment")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/export/trips/<uuid:trip_id>/manifest.csv", export_manifest),
    path("api/dashboard/summary", dashboard_views.summary),
    path("api/dashboard/upcoming-trips", dashboard_views.upcoming_trips),
    path("api/dashboard/recent-clients", dashboard_views.recent_clients),
    path("api/", include(router.urls)),
]
