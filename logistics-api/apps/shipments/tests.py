import re
from decimal import Decimal

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.suppliers.models import Supplier
from apps.products.models import Product
from apps.transports.models import Transport
from apps.drivers.models import Driver
from apps.shipments.models import Shipment, ShipmentProduct
from apps.shipments.services import (
    create_shipment,
    assign_transport,
    update_shipment_status,
)

User = get_user_model()


class TestShipmentModel(TestCase):
    """Tests for the Shipment model and tracking_number auto-generation."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='customer1',
            email='customer1@test.com',
            password='testpass123',
            first_name='Juan',
            last_name='Perez',
        )
        self.customer = Customer.objects.create(
            user=self.user,
            phone='999000001',
            address='Av. Test 1',
            city='Lima',
            country='Peru',
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Test',
            code='ALM-T01',
            address='Calle Almacen 1',
            city='Lima',
            state='Lima',
            country='Peru',
            capacity_m3=Decimal('500.00'),
        )

    def _make_shipment(self, **kwargs):
        defaults = {
            'customer': self.customer,
            'origin_warehouse': self.warehouse,
            'destination_address': 'Av. Destino 123',
            'destination_city': 'Arequipa',
            'destination_country': 'Peru',
        }
        defaults.update(kwargs)
        return Shipment.objects.create(**defaults)

    def test_tracking_number_auto_generado(self):
        shipment = self._make_shipment()
        self.assertIsNotNone(shipment.tracking_number)
        self.assertTrue(len(shipment.tracking_number) > 0)
        # Format: LOG-XXXXXXXX-YYYYMMDD
        pattern = r'^LOG-[A-F0-9]{8}-\d{8}$'
        self.assertRegex(
            shipment.tracking_number,
            pattern,
            msg=f"tracking_number '{shipment.tracking_number}' no sigue el formato LOG-XXXXXXXX-YYYYMMDD",
        )

    def test_tracking_number_unico(self):
        shipment1 = self._make_shipment()
        shipment2 = self._make_shipment()
        self.assertNotEqual(shipment1.tracking_number, shipment2.tracking_number)

    def test_status_inicial_pending(self):
        shipment = self._make_shipment()
        self.assertEqual(shipment.status, Shipment.Status.PENDING)

    def test_str_incluye_tracking_y_status(self):
        shipment = self._make_shipment()
        str_repr = str(shipment)
        self.assertIn(shipment.tracking_number, str_repr)
        self.assertIn(shipment.get_status_display(), str_repr)


class TestShipmentServices(TestCase):
    """Tests for services: create_shipment, assign_transport, update_shipment_status."""

    def setUp(self):
        # Customer
        self.customer_user = User.objects.create_user(
            username='customer2',
            email='customer2@test.com',
            password='testpass123',
            first_name='Ana',
            last_name='Garcia',
        )
        self.customer = Customer.objects.create(
            user=self.customer_user,
            phone='999000002',
            address='Av. Lima 200',
            city='Lima',
            country='Peru',
        )

        # Warehouse
        self.warehouse = Warehouse.objects.create(
            name='Almacen Principal',
            code='ALM-P01',
            address='Calle Principal 1',
            city='Lima',
            state='Lima',
            country='Peru',
            capacity_m3=Decimal('1000.00'),
        )

        # Supplier
        self.supplier = Supplier.objects.create(
            name='Proveedor Tech',
            tax_id='RUC-99991',
            contact_name='Carlos Proveedor',
            email='proveedor@tech.com',
            phone='999000003',
            address='Av. Proveedor 1',
            city='Lima',
            country='Peru',
        )

        # Product
        self.product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Laptop Test',
            sku='LAP-TEST-001',
            unit_price=Decimal('2500.00'),
            weight_kg=Decimal('2.100'),
            stock=10,
        )

        # Transport
        self.transport = Transport.objects.create(
            license_plate='ABC-123',
            type=Transport.VehicleType.TRUCK,
            brand='Mercedes',
            model='Actros',
            year=2022,
            capacity_kg=Decimal('5000.00'),
            capacity_m3=Decimal('20.00'),
            status=Transport.Status.AVAILABLE,
        )

        # Driver
        self.driver_user = User.objects.create_user(
            username='driver1',
            email='driver1@test.com',
            password='testpass123',
            first_name='Carlos',
            last_name='Lopez',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-001',
            license_type=Driver.LicenseType.C,
            phone='999000004',
            status=Driver.Status.AVAILABLE,
        )

        # Base shipment data for create_shipment
        self.shipment_data = {
            'customer': self.customer,
            'origin_warehouse': self.warehouse,
            'destination_address': 'Av. Test 123',
            'destination_city': 'Lima',
            'destination_country': 'Peru',
            'products': [{'product_id': self.product.id, 'quantity': 3}],
        }

    def test_create_shipment_decrementa_stock(self):
        create_shipment(dict(self.shipment_data))
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 7)

    def test_create_shipment_calcula_peso_total(self):
        shipment = create_shipment(dict(self.shipment_data))
        expected_weight = Decimal('2.100') * 3
        self.assertEqual(shipment.total_weight_kg, expected_weight)

    def test_create_shipment_calcula_costo(self):
        # shipping_cost = 50.00 + (6.300 * 2.5) + (1 * 5.0) = 70.75
        shipment = create_shipment(dict(self.shipment_data))
        expected_cost = Decimal('50.00') + (Decimal('6.300') * Decimal('2.5')) + Decimal('5.0')
        self.assertEqual(shipment.shipping_cost, expected_cost.quantize(Decimal('0.01')))

    def test_create_shipment_stock_insuficiente_rollback(self):
        data = dict(self.shipment_data)
        data['products'] = [{'product_id': self.product.id, 'quantity': 20}]
        with self.assertRaises(ValidationError):
            create_shipment(data)
        # Stock must remain unchanged (rollback)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)
        # No Shipment should have been persisted
        self.assertEqual(Shipment.objects.count(), 0)

    def test_assign_transport_cambia_status_transport(self):
        shipment = create_shipment(dict(self.shipment_data))
        assign_transport(shipment, self.transport, self.driver)
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.status, Transport.Status.IN_ROUTE)

    def test_assign_transport_cambia_status_driver(self):
        shipment = create_shipment(dict(self.shipment_data))
        assign_transport(shipment, self.transport, self.driver)
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.status, Driver.Status.ON_ROUTE)

    def test_assign_transport_no_disponible_lanza_error(self):
        self.transport.status = Transport.Status.IN_ROUTE
        self.transport.save()
        shipment = create_shipment(dict(self.shipment_data))
        with self.assertRaises(ValidationError):
            assign_transport(shipment, self.transport, self.driver)

    def test_assign_driver_no_disponible_lanza_error(self):
        self.driver.status = Driver.Status.ON_ROUTE
        self.driver.save()
        shipment = create_shipment(dict(self.shipment_data))
        with self.assertRaises(ValidationError):
            assign_transport(shipment, self.transport, self.driver)

    def test_transicion_valida_pending_a_picked_up(self):
        shipment = create_shipment(dict(self.shipment_data))
        self.assertEqual(shipment.status, Shipment.Status.PENDING)
        updated = update_shipment_status(shipment, Shipment.Status.PICKED_UP)
        self.assertEqual(updated.status, Shipment.Status.PICKED_UP)

    def test_transicion_invalida_lanza_error(self):
        shipment = create_shipment(dict(self.shipment_data))
        # PENDING -> IN_TRANSIT is invalid (must go through PICKED_UP first)
        with self.assertRaises(ValidationError):
            update_shipment_status(shipment, Shipment.Status.IN_TRANSIT)

    def test_delivered_setea_actual_delivery_date(self):
        shipment = create_shipment(dict(self.shipment_data))
        # Move through valid transitions to reach IN_TRANSIT
        shipment.status = Shipment.Status.IN_TRANSIT
        shipment.save(update_fields=['status'])
        updated = update_shipment_status(shipment, Shipment.Status.DELIVERED)
        self.assertIsNotNone(updated.actual_delivery_date)
        from django.utils import timezone
        self.assertEqual(updated.actual_delivery_date, timezone.now().date())

    def test_cancelled_revierte_stock(self):
        shipment = create_shipment(dict(self.shipment_data))
        self.product.refresh_from_db()
        stock_after_create = self.product.stock  # should be 7
        self.assertEqual(stock_after_create, 7)

        update_shipment_status(shipment, Shipment.Status.CANCELLED)
        self.product.refresh_from_db()
        # Stock should be reverted to original 10
        self.assertEqual(self.product.stock, 10)
