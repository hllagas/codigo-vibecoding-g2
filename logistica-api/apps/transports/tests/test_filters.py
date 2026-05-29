import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.drivers.models import Driver
from apps.transports.models import Transport, TransportType


class TransportFilterTest(APITestCase):
    """Tests de filtros, busqueda y ordenamiento en /api/v1/transports/."""

    def setUp(self):
        self.auth_user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.client.force_authenticate(user=self.auth_user)

        driver_user = User.objects.create_user(username='driver01', password='pass')
        self.driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )

        # Crear varios transportes para testear filtros
        self.truck = Transport.objects.create(
            name='Camion Alfa',
            plate_number='CAM-001',
            transport_type=TransportType.TRUCK,
            capacity_kg=Decimal('2000.00'),
            driver=self.driver,
        )
        self.van = Transport.objects.create(
            name='Van Beta',
            plate_number='VAN-001',
            transport_type=TransportType.VAN,
            capacity_kg=Decimal('800.00'),
        )
        self.moto = Transport.objects.create(
            name='Moto Gamma',
            plate_number='MOT-001',
            transport_type=TransportType.MOTORCYCLE,
            capacity_kg=Decimal('50.00'),
            is_active=False,
        )

    # --- Filtros por transport_type ---

    def test_filter_by_transport_type_truck(self):
        """Filtrar por transport_type=truck retorna solo camiones."""
        response = self.client.get('/api/v1/transports/?transport_type=truck')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertGreaterEqual(len(results), 1)
        for item in results:
            self.assertEqual(item['transport_type'], 'truck')

    def test_filter_by_transport_type_van(self):
        """Filtrar por transport_type=van retorna solo furgonetas."""
        response = self.client.get('/api/v1/transports/?transport_type=van')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertGreaterEqual(len(results), 1)
        for item in results:
            self.assertEqual(item['transport_type'], 'van')

    def test_filter_by_transport_type_motorcycle(self):
        """Filtrar por transport_type=motorcycle retorna solo motos."""
        response = self.client.get('/api/v1/transports/?transport_type=motorcycle')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for item in results:
            self.assertEqual(item['transport_type'], 'motorcycle')

    def test_filter_by_transport_type_returns_only_matching(self):
        """El filtro excluye los transportes de otros tipos."""
        response = self.client.get('/api/v1/transports/?transport_type=truck')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [item['plate_number'] for item in response.data['results']]
        self.assertNotIn('VAN-001', plates)
        self.assertNotIn('MOT-001', plates)

    # --- Filtros por is_active ---

    def test_filter_by_is_active_true(self):
        """Filtrar por is_active=true retorna solo activos."""
        response = self.client.get('/api/v1/transports/?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertTrue(item['is_active'])

    def test_filter_by_is_active_false(self):
        """Filtrar por is_active=false retorna solo inactivos."""
        response = self.client.get('/api/v1/transports/?is_active=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertGreaterEqual(len(results), 1)
        for item in results:
            self.assertFalse(item['is_active'])

    # --- Filtros por driver ---

    def test_filter_by_driver_returns_matching(self):
        """Filtrar por driver retorna solo transportes de ese conductor."""
        response = self.client.get(f'/api/v1/transports/?driver={self.driver.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertGreaterEqual(len(results), 1)
        for item in results:
            self.assertEqual(item['driver'], self.driver.id)

    def test_filter_by_nonexistent_driver_returns_empty_or_400(self):
        """Filtrar por driver con ID que no existe: django-filter retorna 400 o lista vacia."""
        response = self.client.get('/api/v1/transports/?driver=99999')
        # django-filter valida la FK y retorna 400 si el valor no existe en la BD
        self.assertIn(
            response.status_code,
            [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST],
        )

    # --- Busqueda por search_fields ---

    def test_search_by_plate_number(self):
        """Buscar por placa retorna el transporte correspondiente."""
        response = self.client.get('/api/v1/transports/?search=CAM-001')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [item['plate_number'] for item in response.data['results']]
        self.assertIn('CAM-001', plates)

    def test_search_by_name(self):
        """Buscar por nombre retorna el transporte correspondiente."""
        response = self.client.get('/api/v1/transports/?search=Van Beta')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertIn('Van Beta', names)

    def test_search_no_match_returns_empty(self):
        """Busqueda sin resultados retorna lista vacia."""
        response = self.client.get('/api/v1/transports/?search=ZZZNOMATCH')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    # --- Ordenamiento ---

    def test_ordering_by_name(self):
        """ordering=name retorna transportes ordenados alfabeticamente."""
        response = self.client.get('/api/v1/transports/?ordering=name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_capacity_kg_desc(self):
        """ordering=-capacity_kg retorna transportes de mayor a menor capacidad."""
        response = self.client.get('/api/v1/transports/?ordering=-capacity_kg')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [float(item['capacity_kg']) for item in response.data['results']]
        self.assertEqual(capacities, sorted(capacities, reverse=True))
