from django.contrib import admin
from .models import Trip, PickupPoint, TripPickup, TripSeat, Reservation


class TripSeatInline(admin.TabularInline):
    model = TripSeat
    extra = 0
    readonly_fields = ("seat_no",)
    can_delete = False


class TripPickupInline(admin.TabularInline):
    model = TripPickup
    extra = 1


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("trip_date", "origin", "destination", "bus", "chauffeur", "status")
    list_filter = ("status", "trip_date", "bus")
    search_fields = ("origin", "destination", "notes")
    inlines = [TripPickupInline, TripSeatInline]
    date_hierarchy = "trip_date"
    ordering = ("-trip_date",)


@admin.register(PickupPoint)
class PickupPointAdmin(admin.ModelAdmin):
    list_display = ("name", "address", "time_hint")
    search_fields = ("name", "address")


@admin.register(TripPickup)
class TripPickupAdmin(admin.ModelAdmin):
    list_display = ("trip", "pickup_point", "pickup_time", "order")
    list_filter = ("trip",)
    ordering = ("trip", "order")


@admin.register(TripSeat)
class TripSeatAdmin(admin.ModelAdmin):
    list_display = ("trip", "seat_no", "blocked", "note")
    list_filter = ("blocked", "trip")
    ordering = ("trip", "seat_no")


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("trip", "contact_client", "status", "quantity", "created_at", "updated_at")
    list_filter = ("status", "trip", "created_at")
    search_fields = (
        "contact_client__first_name",
        "contact_client__last_name",
        "contact_client__passport_id",
    )
    date_hierarchy = "created_at"
