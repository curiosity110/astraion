from rest_framework import serializers
from .models import Client, Phone
from django.conf import settings
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
            "passport_id","email","notes","is_active","created_at","updated_at",
            "phones",
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
        ui = settings.FRONTEND_BASE_URL
        return {"ui.self": f"{ui}/clients/{obj.id}"}
