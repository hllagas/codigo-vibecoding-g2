import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.drivers.models import Driver
from apps.transports.models import Transport, TransportType


class TransportAuthTest(APITestCase):
    """Tests de autenticacion: todos los endpoints requieren JWT."""

    def setUp(self):
        self.auth_user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        driver_user = User.objects.create_user(username='driver01', password='pass')
        self.driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )
        self.transport = Transport.objects.create(
            name='Camion Test',
            plate_number='TST-001',
            transport_type=TransportType.TRUCK,
            capacity_kg=Decimal('1000.00'),
        )
        self.url_list = '/api/v1/transports/'
        self.url_detail = f'/api/v1/transports/{self.transport.id}/'

    def test_list_unauthenticated_returns_401(self):
        """GET /transports/ sin autenticacion retorna 401."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        """POST /transports/ sin autenticacion retorna 401."""
        payload = {
            'name': 'Sin Auth',
            'plate_number': 'NOA-001',
            'transport_type': 'van',
            'capacity_kg': '500.00',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_unauthenticated_returns_401(self):
        """GET /transports/{id}/ sin autenticacion retorna 401."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_unauthenticated_returns_401(self):
        """PUT /transports/{id}/ sin autenticacion retorna 401."""
        payload = {
            'name': 'Sin Auth',
            'plate_number': 'TST-001',
            'transport_type': 'truck',
            'capacity_kg': '1000.00',
        }
        response = self.client.put(self.url_detail, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_partial_update_unauthenticated_returns_401(self):
        """PATCH /transports/{id}/ sin autenticacion retorna 401."""
        response = self.client.patch(self.url_detail, {'name': 'X'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_unauthenticated_returns_401(self):
        """DELETE /transports/{id}/ sin autenticacion retorna 401."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_list(self):
        """Un usuario autenticado puede listar transportes."""
        self.client.force_authenticate(user=self.auth_user)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authenticated_user_can_create(self):
        """Un usuario autenticado puede crear un transporte."""
        self.client.force_authenticate(user=self.auth_user)
        payload = {
            'name': 'Con Auth',
            'plate_number': 'AUT-001',
            'transport_type': 'van',
            'capacity_kg': '500.00',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
