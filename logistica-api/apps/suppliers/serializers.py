from rest_framework import serializers

from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        # Campos generados automáticamente — no se permiten en escritura
        read_only_fields = ['id', 'created_at', 'updated_at']
