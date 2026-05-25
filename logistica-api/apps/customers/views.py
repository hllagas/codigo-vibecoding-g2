from rest_framework import viewsets

from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    # Todos los clientes — sin filtrar por is_active en el queryset base
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    # Filtros por campo exacto — incluye customer_type para filtrar por tipo de cliente
    filterset_fields = ['customer_type', 'city', 'country', 'is_active']
    # Búsqueda de texto libre en nombre, email e identificador fiscal
    search_fields = ['name', 'email', 'tax_id']
    # Ordenamiento permitido
    ordering_fields = ['name', 'customer_type', 'created_at']
