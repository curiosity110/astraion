from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client
from .serializers import ClientSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().prefetch_related("phones").order_by("last_name","first_name")
    serializer_class = ClientSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["birth_date", "nationality", "is_active", "created_at"]
    search_fields = ["first_name","last_name","passport_id","email","phones__e164"]

    def get_queryset(self):
        return super().get_queryset().distinct()
