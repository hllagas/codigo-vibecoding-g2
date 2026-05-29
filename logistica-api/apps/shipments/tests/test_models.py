"""
Tests de los modelos Shipment y ShipmentItem.

Cubre: creación exitosa, campos por defecto, restricciones unique,
campos nullable, cascades y timestamps automáticos.
"""
import datetime
from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase

from apps.shipments.models import VALID_TRANSITIONS, Shipment, ShipmentItem

from .helpers import (
    make_customer,
    make_product,
    make_shipment,
    make_shipment_item,
    make_warehouse,
)


class ShipmentModelTest(TestCase):
    """Tests del modelo Shipment."""

    def setUp(self):
        self.customer = make_customer()
        self.warehouse = make_warehouse()

    # --- Happy path ---

    def test_create_shipment_success(self):
        """Crear un Shipment con datos válidos mínimos."""
        shipment = make_shipment(self.customer, self.warehouse, tracking='TRK-001')
        self.assertIsNotNone(shipment.id)
        self.assertEqual(shipment.tracking_number, 'TRK-001')
        self.assertEqual(shipment.customer, self.customer)
        self.assertEqual(shipment.origin_warehouse, self.warehouse)

    def test_status_default_pending(self):
        """El estado por defecto de un nuevo envío es 'pending'."""
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertEqual(shipment.status, 'pending')

    def test_route_is_null_by_default(self):
        """El campo route es nullable y debe ser None al crear sin ruta."""
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertIsNone(shipment.route)

    def test_notes_nullable(self):
        """El campo notes es nullable; aceptar None sin error."""
        shipment = make_shipment(self.customer, self.warehouse, notes=None)
        self.assertIsNone(shipment.notes)

    def test_actual_delivery_date_nullable(self):
        """actual_delivery_date es nullable; aceptar None sin error."""
        shipment = make_shipment(self.customer, self.warehouse, actual_delivery_date=None)
        self.assertIsNone(shipment.actual_delivery_date)

    def test_auto_timestamps(self):
        """created_at y updated_at se asignan automáticamente al crear."""
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertIsNotNone(shipment.created_at)
        self.assertIsNotNone(shipment.updated_at)

    def test_str_representation(self):
        """__str__ retorna tracking_number y status entre corchetes."""
        shipment = make_shipment(self.customer, self.warehouse, tracking='TRK-STR')
        self.assertIn('TRK-STR', str(shipment))
        self.assertIn('pending', str(shipment))

    # --- Unhappy path ---

    def test_tracking_number_unique(self):
        """No se pueden crear dos envíos con el mismo tracking_number."""
        make_shipment(self.customer, self.warehouse, tracking='TRK-DUP')
        with self.assertRaises(Exception):
            make_shipment(self.customer, self.warehouse, tracking='TRK-DUP')

    # --- Edge case ---

    def test_valid_transitions_dict_structure(self):
        """VALID_TRANSITIONS cubre todos los estados y sus transiciones."""
        self.assertIn('processing', VALID_TRANSITIONS['pending'])
        self.assertIn('cancelled', VALID_TRANSITIONS['pending'])
        self.assertIn('in_transit', VALID_TRANSITIONS['processing'])
        self.assertIn('cancelled', VALID_TRANSITIONS['processing'])
        self.assertIn('delivered', VALID_TRANSITIONS['in_transit'])
        self.assertIn('returned', VALID_TRANSITIONS['in_transit'])
        self.assertEqual(VALID_TRANSITIONS['delivered'], [])
        self.assertEqual(VALID_TRANSITIONS['cancelled'], [])
        self.assertEqual(VALID_TRANSITIONS['returned'], [])

    def test_notes_with_value(self):
        """El campo notes acepta texto."""
        shipment = make_shipment(self.customer, self.warehouse, notes='Frágil, manejar con cuidado')
        self.assertEqual(shipment.notes, 'Frágil, manejar con cuidado')

    def test_actual_delivery_date_with_value(self):
        """actual_delivery_date acepta una fecha válida."""
        delivery_date = datetime.date(2027, 7, 1)
        shipment = make_shipment(
            self.customer, self.warehouse,
            actual_delivery_date=delivery_date,
        )
        self.assertEqual(shipment.actual_delivery_date, delivery_date)


class ShipmentItemModelTest(TestCase):
    """Tests del modelo ShipmentItem."""

    def setUp(self):
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.shipment = make_shipment(self.customer, self.warehouse)
        self.product = make_product()

    # --- Happy path ---

    def test_create_shipment_item_success(self):
        """Crear un ShipmentItem con datos válidos."""
        item = make_shipment_item(self.shipment, self.product, quantity=3)
        self.assertIsNotNone(item.id)
        self.assertEqual(item.quantity, 3)
        self.assertEqual(item.shipment, self.shipment)
        self.assertEqual(item.product, self.product)

    def test_unit_price_at_shipment_stored(self):
        """unit_price_at_shipment se guarda como valor independiente del producto."""
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price_at_shipment=Decimal('1500.00'),
        )
        self.assertEqual(item.unit_price_at_shipment, Decimal('1500.00'))

    # --- Unhappy path ---

    def test_shipment_item_unique_together(self):
        """No se puede agregar el mismo producto dos veces al mismo envío."""
        make_shipment_item(self.shipment, self.product, quantity=1)
        with self.assertRaises(IntegrityError):
            ShipmentItem.objects.create(
                shipment=self.shipment,
                product=self.product,
                quantity=2,
                unit_price_at_shipment=Decimal('999.99'),
            )

    # --- Edge case ---

    def test_delete_shipment_cascades_items(self):
        """Al eliminar un Shipment se eliminan en cascada sus ShipmentItems."""
        make_shipment_item(self.shipment, self.product, quantity=1)
        shipment_id = self.shipment.id
        self.shipment.delete()
        self.assertFalse(ShipmentItem.objects.filter(shipment_id=shipment_id).exists())

    def test_shipment_item_different_shipments_same_product(self):
        """El mismo producto puede estar en dos envíos distintos sin violar unique_together."""
        other_shipment = make_shipment(self.customer, self.warehouse)
        item1 = make_shipment_item(self.shipment, self.product, quantity=1)
        item2 = make_shipment_item(other_shipment, self.product, quantity=2)
        self.assertNotEqual(item1.shipment_id, item2.shipment_id)
        self.assertEqual(item1.product_id, item2.product_id)
