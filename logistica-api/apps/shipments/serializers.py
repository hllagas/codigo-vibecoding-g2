from rest_framework import serializers

from .models import VALID_TRANSITIONS, Shipment, ShipmentItem


class ShipmentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentItem
        fields = '__all__'
        read_only_fields = ['id', 'shipment']


class ShipmentSerializer(serializers.ModelSerializer):
    items = ShipmentItemSerializer(many=True, required=False)

    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_items(self, items):
        product_ids = [item['product'].id for item in items]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError('No puede haber dos ítems con el mismo producto.')
        return items

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        shipment = Shipment.objects.create(**validated_data)
        for item_data in items_data:
            ShipmentItem.objects.create(shipment=shipment, **item_data)
        return shipment

    def update(self, instance, validated_data):
        validated_data.pop('items', None)
        return super().update(instance, validated_data)


class ShipmentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=list(VALID_TRANSITIONS.keys()))
