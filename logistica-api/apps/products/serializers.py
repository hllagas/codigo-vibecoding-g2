from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    # URL firmada de la imagen — solo lectura, generada desde el campo image del modelo
    image_url = serializers.SerializerMethodField(read_only=True)

    def get_image_url(self, obj):
        # Retorna la URL de la imagen si existe, None si el producto no tiene imagen
        if obj.image:
            return obj.image.url
        return None

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'category',
            'unit_price', 'weight_kg', 'supplier',
            'is_active', 'created_at', 'updated_at', 'image_url',
        ]
        # Campos generados automáticamente — no se permiten en escritura
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductImageUploadSerializer(serializers.ModelSerializer):
    """Serializer exclusivo para el action upload_image — solo acepta el campo image."""

    # El campo image es requerido en el upload aunque sea opcional en el modelo
    image = serializers.ImageField(required=True)

    class Meta:
        model = Product
        fields = ['image']
