from rest_framework import viewsets

from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    # Todos los productos sin filtrar por is_active en el queryset base
    # para permitir listar productos inactivos cuando se filtra explícitamente
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    # Filtros por campo exacto: ?category=laptop, ?supplier=3, ?is_active=false
    filterset_fields = ['category', 'supplier', 'is_active']
    # Búsqueda de texto libre por nombre o SKU
    search_fields = ['name', 'sku']
    # Ordenamiento permitido
    ordering_fields = ['name', 'unit_price', 'created_at']
