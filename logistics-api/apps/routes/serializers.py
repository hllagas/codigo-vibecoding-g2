from rest_framework import serializers

from apps.warehouses.models import Warehouse
from apps.routes.models import Route, RouteStop


class WarehouseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name']
        read_only_fields = ['id', 'name']


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = '__all__'
        read_only_fields = ['id']


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['origin_warehouse'] = WarehouseSummarySerializer(
            instance.origin_warehouse
        ).data
        representation['stops'] = RouteStopSerializer(
            instance.stops.all(), many=True
        ).data
        return representation
