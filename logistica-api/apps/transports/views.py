from rest_framework import viewsets

from .models import Transport
from .serializers import TransportSerializer


class TransportViewSet(viewsets.ModelViewSet):
    queryset = Transport.objects.select_related('driver').all()
    serializer_class = TransportSerializer
    filterset_fields = ['transport_type', 'is_active', 'driver']
    search_fields = ['name', 'plate_number']
    ordering_fields = ['name', 'capacity_kg', 'created_at']
