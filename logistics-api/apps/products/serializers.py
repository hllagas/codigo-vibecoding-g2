from rest_framework import serializers
from .models import Product


class SupplierSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)


class WarehouseSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)


class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['supplier'] = SupplierSummarySerializer(instance.supplier).data
        representation['warehouse'] = WarehouseSummarySerializer(instance.warehouse).data
        return representation
