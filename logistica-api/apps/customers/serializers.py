from rest_framework import serializers

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        # Campos generados automáticamente — no se permiten en escritura
        read_only_fields = ['id', 'created_at', 'updated_at']
