from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import VALID_TRANSITIONS, Shipment
from .serializers import ShipmentSerializer, ShipmentStatusSerializer


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.select_related(
        'customer', 'origin_warehouse', 'route'
    ).prefetch_related('items__product').all()
    serializer_class = ShipmentSerializer
    filterset_fields = ['status', 'customer', 'origin_warehouse', 'route']
    search_fields = ['tracking_number', 'destination_city', 'destination_country']
    ordering_fields = ['scheduled_delivery_date', 'created_at', 'status']

    @action(methods=['patch'], detail=True, url_path='status')
    def update_status(self, request, pk=None):
        shipment = self.get_object()
        serializer = ShipmentStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        new_status = serializer.validated_data['status']
        allowed = VALID_TRANSITIONS.get(shipment.status, [])
        if new_status not in allowed:
            return Response(
                {'status': f"Transición de '{shipment.status}' a '{new_status}' no está permitida."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        shipment.status = new_status
        shipment.save(update_fields=['status', 'updated_at'])
        return Response(ShipmentSerializer(shipment).data)
