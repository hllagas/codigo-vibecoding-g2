from rest_framework import serializers

from .models import Transport


class DriverReadSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    license_number = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)


class TransportSerializer(serializers.ModelSerializer):
    driver_detail = DriverReadSerializer(source='driver', read_only=True)

    class Meta:
        model = Transport
        fields = [
            'id',
            'name',
            'plate_number',
            'transport_type',
            'capacity_kg',
            'driver',
            'driver_detail',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'driver_detail', 'created_at', 'updated_at']
