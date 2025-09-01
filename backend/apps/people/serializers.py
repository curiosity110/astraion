from rest_framework import serializers
from .models import Client, Phone, ClientNote
from django.conf import settings
from django.urls import reverse
import phonenumbers


class RelaxedPhoneField(serializers.CharField):
    def to_internal_value(self, data):
        data = super().to_internal_value(data)
        try:
            num = phonenumbers.parse(data, None)
            return phonenumbers.format_number(num, phonenumbers.PhoneNumberFormat.E164)
        except Exception:
            return data

class PhoneSerializer(serializers.ModelSerializer):
    e164 = RelaxedPhoneField()

    class Meta:
        model = Phone
        fields = ("id", "e164", "label", "is_primary")

class ClientSerializer(serializers.ModelSerializer):
    phones = PhoneSerializer(many=True, required=False)
    links = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = (
            "id","first_name","last_name","birth_date","nationality",
            "passport_id","email","notes","tags","is_active","created_at","updated_at",
            "phones","links",
        )
        read_only_fields = ("created_at","updated_at")

    def create(self, validated_data):
        phones = validated_data.pop("phones", [])
        client = Client.objects.create(**validated_data)
        for p in phones:
            Phone.objects.create(client=client, **p)
        return client

    def update(self, instance, validated_data):
        phones = validated_data.pop("phones", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if phones is not None:
            instance.phones.all().delete()
            for p in phones:
                Phone.objects.create(client=instance, **p)
        return instance
    
    def get_links(self, obj):
        req = self.context.get("request")
        ui = settings.FRONTEND_BASE_URL

        def abs_url(name, *args, **kwargs):
            return req.build_absolute_uri(reverse(name, args=args, kwargs=kwargs)) if req else ""

        base_res = abs_url("reservation-list")
        res_url = f"{base_res}?contact_client={obj.id}" if base_res else ""
        return {
            "api.self": abs_url("client-detail", obj.id),
            "api.reservations": res_url,
            "api.history": abs_url("client-history", obj.id),
            "ui.self": f"{ui}/clients/{obj.id}",
        }


class ClientNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientNote
        fields = ("id", "author", "text", "created_at")

