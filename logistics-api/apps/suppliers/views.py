from rest_framework.viewsets import ModelViewSet
from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
