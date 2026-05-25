from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        # Campos generados automáticamente — no se permiten en escritura
        read_only_fields = ['id', 'created_at', 'updated_at']
