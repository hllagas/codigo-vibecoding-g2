from rest_framework import serializers

from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.products.models import Product

from .models import Shipment, ShipmentProduct


# ---------------------------------------------------------------------------
# Summary serializers (read-only, for FK expansion in GET responses)
# ---------------------------------------------------------------------------

class CustomerSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    company_name = serializers.CharField(read_only=True)
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, instance):
        return instance.user.get_full_name()


class WarehouseSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)


class TransportSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    license_plate = serializers.CharField(read_only=True)


class DriverSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, instance):
        return instance.user.get_full_name()


class ProductSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    sku = serializers.CharField(read_only=True)


# ---------------------------------------------------------------------------
# ShipmentProductSerializer — for read (nested in ShipmentSerializer)
# and direct management via ShipmentProductViewSet
# ---------------------------------------------------------------------------

class ShipmentProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = ShipmentProduct
        fields = ['id', 'shipment', 'product', 'quantity', 'unit_price']
        read_only_fields = ['id', 'unit_price']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['product'] = ProductSummarySerializer(instance.product).data
        return representation


# ---------------------------------------------------------------------------
# ShipmentCreateSerializer — write-only, used on POST /shipments/
# ---------------------------------------------------------------------------

class ShipmentProductInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class ShipmentCreateSerializer(serializers.ModelSerializer):
    products = ShipmentProductInputSerializer(many=True, write_only=True)

    class Meta:
        model = Shipment
        fields = [
            'customer',
            'origin_warehouse',
            'destination_address',
            'destination_city',
            'destination_country',
            'route',
            'estimated_delivery_date',
            'notes',
            'products',
        ]

    def validate_products(self, value):
        if not value:
            raise serializers.ValidationError('Debe incluir al menos un producto.')

        for item in value:
            try:
                product = Product.objects.get(id=item['product_id'])
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f"El producto con id={item['product_id']} no existe."
                )
            if not product.is_active:
                raise serializers.ValidationError(
                    f"El producto con id={item['product_id']} no esta activo."
                )
            if item['quantity'] <= 0:
                raise serializers.ValidationError(
                    f"La cantidad debe ser mayor que 0 para el producto id={item['product_id']}."
                )

        return value

    def create(self, validated_data):
        from .services import create_shipment
        return create_shipment(validated_data)


# ---------------------------------------------------------------------------
# ShipmentSerializer — read-only, used on GET list/detail and 201 response
# ---------------------------------------------------------------------------

class ShipmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = [
            'id',
            'tracking_number',
            'total_weight_kg',
            'shipping_cost',
            'actual_delivery_date',
            'created_at',
            'updated_at',
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['customer'] = CustomerSummarySerializer(instance.customer).data
        representation['origin_warehouse'] = WarehouseSummarySerializer(instance.origin_warehouse).data
        representation['transport'] = (
            TransportSummarySerializer(instance.transport).data
            if instance.transport else None
        )
        representation['driver'] = (
            DriverSummarySerializer(instance.driver).data
            if instance.driver else None
        )
        representation['route'] = (
            {'id': instance.route.id, 'name': instance.route.name}
            if instance.route else None
        )
        representation['shipment_products'] = ShipmentProductSerializer(
            instance.shipment_products.select_related('product').all(),
            many=True,
        ).data
        return representation


# ---------------------------------------------------------------------------
# ShipmentStatusUpdateSerializer — write-only, used on POST update-status
# ---------------------------------------------------------------------------

class ShipmentStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Shipment.Status.choices)
