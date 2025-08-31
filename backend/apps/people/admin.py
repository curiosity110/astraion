from django.contrib import admin
from .models import Client, Phone


class PhoneInline(admin.TabularInline):
    model = Phone
    extra = 1


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "passport_id", "email", "is_active")
    list_filter = ("is_active", "nationality", "created_at")
    search_fields = ("first_name", "last_name", "passport_id", "email", "phones__e164")
    ordering = ("last_name", "first_name")
    inlines = [PhoneInline]


@admin.register(Phone)
class PhoneAdmin(admin.ModelAdmin):
    list_display = ("client", "e164", "label", "is_primary")
    list_filter = ("is_primary",)
    search_fields = ("e164",)
