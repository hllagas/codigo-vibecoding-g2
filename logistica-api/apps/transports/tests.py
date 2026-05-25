import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.drivers.models import Driver
from apps.transports.models import Transport, TransportType


class TransportModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='driver01', password='pass')
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )

    def test_create_transport_without_driver(self):
        transport = Transport.objects.create(
            name='Camión Norte',
            plate_number='ABC-123',
            transport_type=TransportType.TRUCK,
            capacity_kg=Decimal('1000.00'),
        )
        self.assertEqual(transport.name, 'Camión Norte')
        self.assertIsNone(transport.driver)

    def test_create_transport_with_driver(self):
        transport = Transport.objects.create(
            name='Van Centro',
            plate_number='XYZ-456',
            transport_type=TransportType.VAN,
            capacity_kg=Decimal('500.00'),
            driver=self.driver,
        )
        self.assertEqual(transport.driver, self.driver)

    def test_is_active_default_true(self):
        transport = Transport.objects.create(
            name='Moto Sur',
            plate_number='MOT-001',
            transport_type=TransportType.MOTORCYCLE,
            capacity_kg=Decimal('50.00'),
        )
        self.assertTrue(transport.is_active)

    def test_plate_number_unique(self):
        Transport.objects.create(
            name='Camión A',
            plate_number='DUP-001',
            transport_type=TransportType.TRUCK,
            capacity_kg=Decimal('1000.00'),
        )
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                name='Camión B',
                plate_number='DUP-001',
                transport_type=TransportType.VAN,
                capacity_kg=Decimal('500.00'),
            )

    def test_set_null_when_driver_deleted(self):
        transport = Transport.objects.create(
            name='Van Este',
            plate_number='VAN-001',
            transport_type=TransportType.VAN,
            capacity_kg=Decimal('500.00'),
            driver=self.driver,
        )
        self.driver.delete()
        transport.refresh_from_db()
        self.assertIsNone(transport.driver)


class TransportViewSetTest(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='admin', password='pass')
        self.client.force_authenticate(user=self.auth_user)
        driver_user = User.objects.create_user(username='driver01', password='pass')
        self.driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )
        self.transport = Transport.objects.create(
            name='Camión Principal',
            plate_number='CAM-001',
            transport_type=TransportType.TRUCK,
            capacity_kg=Decimal('2000.00'),
        )

    def test_list_transports(self):
        response = self.client.get('/api/v1/transports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_transport_without_driver(self):
        response = self.client.post('/api/v1/transports/', {
            'name': 'Van Nueva',
            'plate_number': 'VAN-002',
            'transport_type': 'van',
            'capacity_kg': '600.00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['driver'])

    def test_create_transport_with_driver(self):
        response = self.client.post('/api/v1/transports/', {
            'name': 'Camión Asignado',
            'plate_number': 'CAM-002',
            'transport_type': 'truck',
            'capacity_kg': '1500.00',
            'driver': self.driver.id,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['driver_detail'])
        self.assertEqual(response.data['driver_detail']['license_number'], 'LIC-001')

    def test_create_transport_duplicate_plate(self):
        response = self.client.post('/api/v1/transports/', {
            'name': 'Duplicado',
            'plate_number': 'CAM-001',
            'transport_type': 'truck',
            'capacity_kg': '1000.00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transport_invalid_type(self):
        response = self.client.post('/api/v1/transports/', {
            'name': 'Helicóptero',
            'plate_number': 'HEL-001',
            'transport_type': 'helicopter',
            'capacity_kg': '500.00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transport_missing_required_field(self):
        response = self.client.post('/api/v1/transports/', {
            'name': 'Sin placa',
            'transport_type': 'van',
            'capacity_kg': '500.00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_transport(self):
        response = self.client.get(f'/api/v1/transports/{self.transport.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('driver_detail', response.data)

    def test_retrieve_transport_not_found(self):
        response = self.client.get('/api/v1/transports/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_by_transport_type(self):
        response = self.client.get('/api/v1/transports/?transport_type=truck')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['transport_type'], 'truck')

    def test_filter_by_is_active(self):
        response = self.client.get('/api/v1/transports/?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_by_plate_number(self):
        response = self.client.get('/api/v1/transports/?search=CAM-001')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_patch_transport(self):
        response = self.client.patch(
            f'/api/v1/transports/{self.transport.id}/',
            {'is_active': False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    def test_delete_transport(self):
        response = self.client.delete(f'/api/v1/transports/{self.transport.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/transports/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
