from django.core.exceptions import ValidationError
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from .models import Shipment, ShipmentProduct
from .serializers import (
    ShipmentSerializer,
    ShipmentCreateSerializer,
    ShipmentStatusUpdateSerializer,
    ShipmentProductSerializer,
)
from .services import update_shipment_status


class ShipmentViewSet(ModelViewSet):
    queryset = Shipment.objects.select_related(
        'customer__user',
        'origin_warehouse',
        'transport',
        'driver__user',
        'route',
    ).prefetch_related('shipment_products__product').all()

    def get_serializer_class(self):
        if self.action == 'create':
            return ShipmentCreateSerializer
        if self.action == 'update_status':
            return ShipmentStatusUpdateSerializer
        return ShipmentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shipment = serializer.save()
        read_serializer = ShipmentSerializer(shipment, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        shipment = self.get_object()
        serializer = ShipmentStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = update_shipment_status(shipment, serializer.validated_data['status'])
        except ValidationError as e:
            return Response({'detail': e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ShipmentSerializer(updated, context={'request': request}).data)


class ShipmentProductViewSet(ModelViewSet):
    queryset = ShipmentProduct.objects.select_related('shipment', 'product').all()
    serializer_class = ShipmentProductSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        shipment_id = self.request.query_params.get('shipment')
        if shipment_id:
            qs = qs.filter(shipment_id=shipment_id)
        return qs
