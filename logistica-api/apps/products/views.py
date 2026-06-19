from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .models import Product
from .serializers import ProductImageUploadSerializer, ProductSerializer


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

    @extend_schema(
        summary='Subir imagen del producto',
        description='Sube o reemplaza la imagen de un producto. Acepta multipart/form-data con el campo image.',
        request=ProductImageUploadSerializer,
        responses={
            200: ProductSerializer,
            400: OpenApiResponse(description='Imagen inválida o no proporcionada'),
        },
        tags=['products'],
    )
    @action(
        detail=True,
        methods=['post'],
        url_path='upload-image',
        parser_classes=[MultiPartParser],
    )
    def upload_image(self, request, pk=None):
        """Sube o reemplaza la imagen del producto al bucket GCS configurado."""
        product = self.get_object()
        serializer = ProductImageUploadSerializer(product, data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Retornar el producto completo con la URL firmada de la imagen
            return Response(ProductSerializer(product, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
