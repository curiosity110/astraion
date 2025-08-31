from django.contrib import admin
from .models import BusType, Bus, Chauffeur


@admin.register(BusType)
class BusTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "seats_count")
    search_fields = ("name",)


@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ("plate", "label", "bus_type", "active")
    list_filter = ("active", "bus_type")
    search_fields = ("plate", "label")
    ordering = ("plate",)


@admin.register(Chauffeur)
class ChauffeurAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "active")
    list_filter = ("active",)
    search_fields = ("name", "phone")
