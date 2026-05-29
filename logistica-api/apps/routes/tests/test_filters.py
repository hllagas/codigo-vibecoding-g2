"""Tests de filtros, busqueda y ordenamiento del ViewSet de Route.

Cubre filterset_fields = ['status', 'transport', 'origin_warehouse']
     search_fields = ['name']
     ordering_fields = ['name', 'status', 'created_at', 'started_at']
"""
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.routes.models import Route
from apps.transports.models import Transport, TransportType
from apps.warehouses.models import Warehouse


def make_warehouse(name='WH', **kwargs):
    return Warehouse.objects.create(
        name=name,
        address='Calle 1',
        city='Bogota',
        country='Colombia',
        capacity=500,
        **kwargs,
    )


def make_transport(plate='TR-001', **kwargs):
    return Transport.objects.create(
        name='Camion',
        plate_number=plate,
        transport_type=TransportType.TRUCK,
        capacity_kg=Decimal('500.00'),
        **kwargs,
    )


class RouteFilterTest(APITestCase):
    """Tests de filtrado por filterset_fields."""

    def setUp(self):
        self.user = User.objects.create_user(username='filteruser', password='pass123')
        self.client.force_authenticate(user=self.user)
        self.wh1 = make_warehouse(name='WH1')
        self.wh2 = make_warehouse(name='WH2')
        self.tr1 = make_transport(plate='P-001')
        self.tr2 = make_transport(plate='P-002')
        # Ruta 1: planned + wh1 + tr1
        self.route_planned = Route.objects.create(
            name='Ruta Planificada',
            origin_warehouse=self.wh1,
            transport=self.tr1,
            status='planned',
        )
        # Ruta 2: in_progress + wh2 + tr2
        self.route_progress = Route.objects.create(
            name='Ruta En Progreso',
            origin_warehouse=self.wh2,
            transport=self.tr2,
            status='in_progress',
        )
        # Ruta 3: completed + wh1 + tr2
        self.route_completed = Route.objects.create(
            name='Ruta Completada',
            origin_warehouse=self.wh1,
            transport=self.tr2,
            status='completed',
        )

    # --- Filtro por status ---

    def test_filter_by_status_planned(self):
        """Filtrar por status=planned devuelve solo rutas planned."""
        response = self.client.get('/api/v1/routes/?status=planned')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = [r['id'] for r in results]
        self.assertIn(self.route_planned.id, ids)
        self.assertNotIn(self.route_progress.id, ids)
        self.assertNotIn(self.route_completed.id, ids)

    def test_filter_by_status_in_progress(self):
        """Filtrar por status=in_progress devuelve solo rutas en progreso."""
        response = self.client.get('/api/v1/routes/?status=in_progress')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = [r['id'] for r in results]
        self.assertIn(self.route_progress.id, ids)
        self.assertNotIn(self.route_planned.id, ids)

    def test_filter_by_status_completed(self):
        """Filtrar por status=completed devuelve solo rutas completadas."""
        response = self.client.get('/api/v1/routes/?status=completed')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = [r['id'] for r in results]
        self.assertIn(self.route_completed.id, ids)
        self.assertNotIn(self.route_planned.id, ids)

    def test_filter_by_transport(self):
        """Filtrar por transport=tr2.id devuelve rutas asignadas a ese transporte."""
        response = self.client.get(f'/api/v1/routes/?transport={self.tr2.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = [r['id'] for r in results]
        self.assertIn(self.route_progress.id, ids)
        self.assertIn(self.route_completed.id, ids)
        self.assertNotIn(self.route_planned.id, ids)

    def test_filter_by_origin_warehouse(self):
        """Filtrar por origin_warehouse=wh1.id devuelve rutas que parten de ese almacen."""
        response = self.client.get(f'/api/v1/routes/?origin_warehouse={self.wh1.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = [r['id'] for r in results]
        self.assertIn(self.route_planned.id, ids)
        self.assertIn(self.route_completed.id, ids)
        self.assertNotIn(self.route_progress.id, ids)

    def test_filter_combined_status_and_warehouse(self):
        """Filtrar por status + origin_warehouse devuelve interseccion correcta."""
        response = self.client.get(
            f'/api/v1/routes/?status=planned&origin_warehouse={self.wh1.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.route_planned.id)

    def test_filter_no_results(self):
        """Filtro que no coincide con nada devuelve lista vacia."""
        response = self.client.get('/api/v1/routes/?status=cancelled')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    # --- Busqueda por name ---

    def test_search_by_name(self):
        """?search=Planificada devuelve rutas cuyo nombre coincide."""
        response = self.client.get('/api/v1/routes/?search=Planificada')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = [r['id'] for r in results]
        self.assertIn(self.route_planned.id, ids)
        self.assertNotIn(self.route_progress.id, ids)

    def test_search_by_name_partial(self):
        """?search=Ruta devuelve todas las rutas (todas tienen 'Ruta' en el nombre)."""
        response = self.client.get('/api/v1/routes/?search=Ruta')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 3)

    def test_search_no_match(self):
        """?search=XYZ_INEXISTENTE devuelve lista vacia."""
        response = self.client.get('/api/v1/routes/?search=XYZ_INEXISTENTE_9999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    # --- Ordenamiento ---

    def test_ordering_by_name_asc(self):
        """?ordering=name devuelve rutas ordenadas por nombre ascendente."""
        response = self.client.get('/api/v1/routes/?ordering=name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        names = [r['name'] for r in results]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_desc(self):
        """?ordering=-name devuelve rutas ordenadas por nombre descendente."""
        response = self.client.get('/api/v1/routes/?ordering=-name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        names = [r['name'] for r in results]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_status(self):
        """?ordering=status devuelve rutas ordenadas por status."""
        response = self.client.get('/api/v1/routes/?ordering=status')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        statuses = [r['status'] for r in results]
        self.assertEqual(statuses, sorted(statuses))
