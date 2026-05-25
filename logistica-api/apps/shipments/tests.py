import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.customers.models import Customer, CustomerType
from apps.products.models import Product
from apps.shipments.models import VALID_TRANSITIONS, Shipment, ShipmentItem
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


def make_customer(**kwargs):
    defaults = dict(
        name='Cliente Test',
        customer_type=CustomerType.COMPANY,
        email='cliente@test.com',
        city='Bogotá',
        country='Colombia',
    )
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


def make_warehouse(**kwargs):
    defaults = dict(
        name='Almacén Test',
        address='Calle 1',
        city='Bogotá',
        country='Colombia',
        capacity=1000,
    )
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


def make_product(sku='SKU-001', **kwargs):
    supplier = Supplier.objects.create(
        name='Proveedor Test', email='p@test.com', city='Bogotá', country='Colombia'
    )
    defaults = dict(
        name='Laptop Test',
        sku=sku,
        category='laptop',
        unit_price=Decimal('999.99'),
        weight_kg=Decimal('2.000'),
        supplier=supplier,
    )
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


def make_shipment(customer, warehouse, tracking='TRK-001', **kwargs):
    defaults = dict(
        tracking_number=tracking,
        customer=customer,
        origin_warehouse=warehouse,
        destination_address='Calle 50 # 10-20',
        destination_city='Medellín',
        destination_country='Colombia',
        scheduled_delivery_date=datetime.date(2027, 6, 30),
        total_weight_kg=Decimal('5.00'),
    )
    defaults.update(kwargs)
    return Shipment.objects.create(**defaults)


class ShipmentModelTest(TestCase):
    def setUp(self):
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.product = make_product()

    def test_create_shipment(self):
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertEqual(shipment.tracking_number, 'TRK-001')
        self.assertIsNone(shipment.route)

    def test_status_default_pending(self):
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertEqual(shipment.status, 'pending')

    def test_tracking_number_unique(self):
        make_shipment(self.customer, self.warehouse, tracking='TRK-001')
        with self.assertRaises(Exception):
            make_shipment(self.customer, self.warehouse, tracking='TRK-001')

    def test_create_shipment_item(self):
        shipment = make_shipment(self.customer, self.warehouse)
        item = ShipmentItem.objects.create(
            shipment=shipment,
            product=self.product,
            quantity=2,
            unit_price_at_shipment=Decimal('999.99'),
        )
        self.assertEqual(item.quantity, 2)

    def test_shipment_item_unique_together(self):
        shipment = make_shipment(self.customer, self.warehouse)
        ShipmentItem.objects.create(
            shipment=shipment, product=self.product,
            quantity=1, unit_price_at_shipment=Decimal('999.99'),
        )
        with self.assertRaises(IntegrityError):
            ShipmentItem.objects.create(
                shipment=shipment, product=self.product,
                quantity=2, unit_price_at_shipment=Decimal('999.99'),
            )

    def test_delete_shipment_cascades_items(self):
        shipment = make_shipment(self.customer, self.warehouse)
        ShipmentItem.objects.create(
            shipment=shipment, product=self.product,
            quantity=1, unit_price_at_shipment=Decimal('999.99'),
        )
        shipment_id = shipment.id
        shipment.delete()
        self.assertFalse(ShipmentItem.objects.filter(shipment_id=shipment_id).exists())

    def test_valid_transitions_dict(self):
        self.assertIn('processing', VALID_TRANSITIONS['pending'])
        self.assertIn('cancelled', VALID_TRANSITIONS['pending'])
        self.assertEqual(VALID_TRANSITIONS['delivered'], [])


class ShipmentViewSetTest(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='admin', password='pass')
        self.client.force_authenticate(user=self.auth_user)
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.product = make_product()
        self.shipment = make_shipment(self.customer, self.warehouse)

    def _base_payload(self, tracking='TRK-NEW', **kwargs):
        data = {
            'tracking_number': tracking,
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'Av. Principal 100',
            'destination_city': 'Cali',
            'destination_country': 'Colombia',
            'scheduled_delivery_date': '2027-08-01',
            'total_weight_kg': '3.50',
        }
        data.update(kwargs)
        return data

    def test_list_shipments(self):
        response = self.client.get('/api/v1/shipments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_shipment_without_items(self):
        response = self.client.post(
            '/api/v1/shipments/', self._base_payload(), format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertEqual(response.data['items'], [])

    def test_create_shipment_with_items(self):
        payload = self._base_payload(tracking='TRK-ITEMS')
        payload['items'] = [
            {
                'product': self.product.id,
                'quantity': 2,
                'unit_price_at_shipment': '999.99',
            }
        ]
        response = self.client.post('/api/v1/shipments/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['quantity'], 2)

    def test_create_shipment_duplicate_tracking(self):
        response = self.client.post(
            '/api/v1/shipments/', self._base_payload(tracking='TRK-001'), format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_shipment_missing_required_field(self):
        payload = self._base_payload()
        del payload['destination_city']
        response = self.client.post('/api/v1/shipments/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_shipment_duplicate_product_in_items(self):
        payload = self._base_payload(tracking='TRK-DUP')
        payload['items'] = [
            {'product': self.product.id, 'quantity': 1, 'unit_price_at_shipment': '100.00'},
            {'product': self.product.id, 'quantity': 2, 'unit_price_at_shipment': '100.00'},
        ]
        response = self.client.post('/api/v1/shipments/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_shipment(self):
        response = self.client.get(f'/api/v1/shipments/{self.shipment.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('items', response.data)

    def test_retrieve_shipment_not_found(self):
        response = self.client.get('/api/v1/shipments/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_by_status(self):
        response = self.client.get('/api/v1/shipments/?status=pending')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['status'], 'pending')

    def test_patch_shipment(self):
        response = self.client.patch(
            f'/api/v1/shipments/{self.shipment.id}/',
            {'notes': 'Frágil'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['notes'], 'Frágil')

    def test_delete_shipment(self):
        response = self.client.delete(f'/api/v1/shipments/{self.shipment.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_status_transition_valid(self):
        response = self.client.patch(
            f'/api/v1/shipments/{self.shipment.id}/status/',
            {'status': 'processing'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'processing')

    def test_status_transition_invalid(self):
        response = self.client.patch(
            f'/api/v1/shipments/{self.shipment.id}/status/',
            {'status': 'delivered'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_transition_unknown_value(self):
        response = self.client.patch(
            f'/api/v1/shipments/{self.shipment.id}/status/',
            {'status': 'flying'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/shipments/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
