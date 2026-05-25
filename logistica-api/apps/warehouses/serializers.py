from rest_framework import serializers

from .models import Warehouse, WarehouseStock


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'
        # Campos generados automáticamente — no se permiten en escritura
        read_only_fields = ['id', 'created_at', 'updated_at']


class WarehouseStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = WarehouseStock
        fields = '__all__'
        # Campos generados automáticamente — no se permiten en escritura
        read_only_fields = ['id', 'updated_at']
