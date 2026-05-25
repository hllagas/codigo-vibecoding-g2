from rest_framework import viewsets

from .models import Driver
from .serializers import DriverSerializer


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.select_related('user').all()
    serializer_class = DriverSerializer
    filterset_fields = ['is_available']
    search_fields = ['license_number', 'phone']
    ordering_fields = ['license_expiry', 'created_at']
