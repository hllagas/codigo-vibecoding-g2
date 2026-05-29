"""
Tests del ShipmentSerializer y ShipmentItemSerializer.

Cubre: escritura anidada, validación de productos duplicados en items,
comportamiento de update (items ignorados) y ShipmentStatusSerializer.
"""
import datetime
from decimal import Decimal

from django.test import TestCase

from apps.shipments.models import Shipment, ShipmentItem
from apps.shipments.serializers import (
    ShipmentItemSerializer,
    ShipmentSerializer,
    ShipmentStatusSerializer,
)

from .helpers import (
    make_customer,
    make_product,
    make_shipment,
    make_warehouse,
)


class ShipmentSerializerWriteTest(TestCase):
    """Tests de escritura del ShipmentSerializer."""

    def setUp(self):
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.product = make_product()
        self.base_data = {
            'tracking_number': 'TRK-SER-001',
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'Calle Serializer 1',
            'destination_city': 'Bogota',
            'destination_country': 'Colombia',
            'scheduled_delivery_date': datetime.date(2027, 9, 1),
            'total_weight_kg': Decimal('4.00'),
        }

    # --- Happy path ---

    def test_create_shipment_without_items(self):
        """Serializer crea Shipment válido sin items."""
        serializer = ShipmentSerializer(data=self.base_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        shipment = serializer.save()
        self.assertIsNotNone(shipment.id)
        self.assertEqual(ShipmentItem.objects.filter(shipment=shipment).count(), 0)

    def test_create_shipment_with_items(self):
        """Serializer crea Shipment con items anidados."""
        data = dict(self.base_data)
        data['tracking_number'] = 'TRK-SER-002'
        data['items'] = [
            {
                'product': self.product.id,
                'quantity': 2,
                'unit_price_at_shipment': Decimal('999.99'),
            }
        ]
        serializer = ShipmentSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        shipment = serializer.save()
        self.assertEqual(ShipmentItem.objects.filter(shipment=shipment).count(), 1)

    # --- Unhappy path ---

    def test_validate_items_duplicate_product(self):
        """validate_items rechaza items con el mismo producto duplicado."""
        data = dict(self.base_data)
        data['tracking_number'] = 'TRK-SER-003'
        data['items'] = [
            {'product': self.product.id, 'quantity': 1, 'unit_price_at_shipment': Decimal('100.00')},
            {'product': self.product.id, 'quantity': 2, 'unit_price_at_shipment': Decimal('100.00')},
        ]
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('items', serializer.errors)

    def test_missing_tracking_number(self):
        """Serializer invalida si falta tracking_number."""
        data = dict(self.base_data)
        del data['tracking_number']
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('tracking_number', serializer.errors)

    def test_missing_destination_city(self):
        """Serializer invalida si falta destination_city."""
        data = dict(self.base_data)
        del data['destination_city']
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_city', serializer.errors)

    # --- Edge case ---

    def test_update_ignores_items(self):
        """update() ignora el campo items; no modifica los items del envío."""
        shipment = make_shipment(self.customer, self.warehouse, tracking='TRK-SER-UPD')
        ShipmentItem.objects.create(
            shipment=shipment,
            product=self.product,
            quantity=5,
            unit_price_at_shipment=Decimal('999.99'),
        )
        product2 = make_product()
        update_data = dict(self.base_data)
        update_data['tracking_number'] = 'TRK-SER-UPD'
        update_data['items'] = [
            {'product': product2.id, 'quantity': 1, 'unit_price_at_shipment': Decimal('50.00')}
        ]
        serializer = ShipmentSerializer(shipment, data=update_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        # items originales no cambian
        self.assertEqual(ShipmentItem.objects.filter(shipment=shipment).count(), 1)
        self.assertTrue(ShipmentItem.objects.filter(shipment=shipment, product=self.product).exists())


class ShipmentStatusSerializerTest(TestCase):
    """Tests del ShipmentStatusSerializer."""

    # --- Happy path ---

    def test_valid_status_choices(self):
        """ShipmentStatusSerializer acepta todos los estados válidos."""
        for valid_status in ['pending', 'processing', 'in_transit', 'delivered', 'cancelled', 'returned']:
            serializer = ShipmentStatusSerializer(data={'status': valid_status})
            self.assertTrue(serializer.is_valid(), f'Falló con status={valid_status}: {serializer.errors}')

    # --- Unhappy path ---

    def test_invalid_status_value(self):
        """ShipmentStatusSerializer rechaza valores no reconocidos."""
        serializer = ShipmentStatusSerializer(data={'status': 'flying'})
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_missing_status_field(self):
        """ShipmentStatusSerializer requiere el campo status."""
        serializer = ShipmentStatusSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)


class ShipmentItemSerializerTest(TestCase):
    """Tests del ShipmentItemSerializer."""

    def setUp(self):
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.shipment = make_shipment(self.customer, self.warehouse)
        self.product = make_product()

    # --- Happy path ---

    def test_valid_shipment_item_data(self):
        """ShipmentItemSerializer valida datos correctos de un ítem."""
        data = {
            'product': self.product.id,
            'quantity': 3,
            'unit_price_at_shipment': '499.99',
        }
        serializer = ShipmentItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # --- Unhappy path ---

    def test_missing_product_field(self):
        """ShipmentItemSerializer requiere el campo product."""
        data = {
            'quantity': 3,
            'unit_price_at_shipment': '499.99',
        }
        serializer = ShipmentItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('product', serializer.errors)

    def test_missing_unit_price_field(self):
        """ShipmentItemSerializer requiere el campo unit_price_at_shipment."""
        data = {
            'product': self.product.id,
            'quantity': 3,
        }
        serializer = ShipmentItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price_at_shipment', serializer.errors)
