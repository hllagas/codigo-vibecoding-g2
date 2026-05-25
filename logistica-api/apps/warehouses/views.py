from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Warehouse, WarehouseStock
from .serializers import WarehouseSerializer, WarehouseStockSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    # Todos los almacenes — sin filtrar por is_active en el queryset base
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    # Filtros por campo exacto
    filterset_fields = ['city', 'country', 'is_active']
    # Búsqueda de texto libre en nombre, dirección y ciudad
    search_fields = ['name', 'address', 'city']
    # Ordenamiento permitido — incluye capacidad para comparar almacenes
    ordering_fields = ['name', 'capacity', 'created_at']

    @action(detail=True, methods=['get'], url_path='stock')
    def stock(self, request, pk=None):
        # Obtener el almacén por pk — retorna 404 si no existe
        warehouse = get_object_or_404(Warehouse, pk=pk)
        # Consultar todos los registros de stock para este almacén
        stock_qs = WarehouseStock.objects.filter(warehouse=warehouse)
        # Serializar y retornar la lista
        serializer = WarehouseStockSerializer(stock_qs, many=True)
        return Response(serializer.data)
