from rest_framework import viewsets

from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    # Todos los proveedores — sin filtrar por is_active para permitir listar inactivos vía ?is_active=false
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    # Filtros por campo exacto
    filterset_fields = ['city', 'country', 'is_active']
    # Búsqueda de texto libre en nombre, email e identificador fiscal
    search_fields = ['name', 'email', 'tax_id']
    # Ordenamiento permitido
    ordering_fields = ['name', 'created_at']
