"""Tests del ViewSet CRUD de Route — /api/v1/routes/."""
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.routes.models import Route, RouteStatus
from apps.transports.models import Transport, TransportType
from apps.warehouses.models import Warehouse


def make_warehouse(name='Almacen Test', **kwargs):
    return Warehouse.objects.create(
        name=name,
        address='Calle 1',
        city='Bogota',
        country='Colombia',
        capacity=1000,
        **kwargs,
    )


def make_transport(plate='T-001', **kwargs):
    return Transport.objects.create(
        name='Camion Test',
        plate_number=plate,
        transport_type=TransportType.TRUCK,
        capacity_kg=Decimal('1000.00'),
        **kwargs,
    )


class RouteViewSetTest(APITestCase):
    """Tests de endpoints /api/v1/routes/ — CRUD estandar."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse()
        self.transport = make_transport()
        self.route = Route.objects.create(
            name='Ruta Principal',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )
        self.valid_payload = {
            'name': 'Ruta Nueva',
            'origin_warehouse': self.warehouse.id,
            'transport': self.transport.id,
        }
        self.url_list = '/api/v1/routes/'
        self.url_detail = f'/api/v1/routes/{self.route.id}/'

    # --- Happy path ---

    def test_list_routes(self):
        """GET /routes/ devuelve 200 con lista paginada."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_create_route_success(self):
        """POST /routes/ con payload valido crea la ruta y devuelve 201."""
        response = self.client.post(self.url_list, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Ruta Nueva')
        self.assertEqual(response.data['status'], 'planned')

    def test_create_route_with_optional_fields(self):
        """POST /routes/ con campos opcionales aceptados correctamente."""
        payload = {
            **self.valid_payload,
            'estimated_duration_hours': '5.50',
            'status': 'in_progress',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'in_progress')

    def test_retrieve_route(self):
        """GET /routes/{id}/ devuelve 200 con datos de la ruta."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.route.id)
        self.assertEqual(response.data['name'], 'Ruta Principal')

    def test_update_route_put(self):
        """PUT /routes/{id}/ con payload completo actualiza la ruta y devuelve 200."""
        payload = {
            'name': 'Ruta Actualizada',
            'origin_warehouse': self.warehouse.id,
            'transport': self.transport.id,
            'status': 'in_progress',
        }
        response = self.client.put(self.url_detail, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Ruta Actualizada')
        self.assertEqual(response.data['status'], 'in_progress')

    def test_partial_update_route_patch(self):
        """PATCH /routes/{id}/ actualiza solo los campos enviados."""
        response = self.client.patch(self.url_detail, {'status': 'in_progress'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_progress')
        # El nombre no cambia
        self.assertEqual(response.data['name'], 'Ruta Principal')

    def test_delete_route(self):
        """DELETE /routes/{id}/ elimina la ruta y devuelve 204."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Confirmar que ya no existe
        self.assertFalse(Route.objects.filter(id=self.route.id).exists())

    # --- Unhappy path ---

    def test_create_route_missing_name(self):
        """POST /routes/ sin name devuelve 400."""
        payload = {
            'origin_warehouse': self.warehouse.id,
            'transport': self.transport.id,
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_missing_origin_warehouse(self):
        """POST /routes/ sin origin_warehouse devuelve 400."""
        payload = {
            'name': 'Ruta Sin Almacen',
            'transport': self.transport.id,
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_missing_transport(self):
        """POST /routes/ sin transport devuelve 400."""
        payload = {
            'name': 'Ruta Sin Transporte',
            'origin_warehouse': self.warehouse.id,
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_invalid_transport(self):
        """POST /routes/ con transport inexistente devuelve 400."""
        payload = {
            'name': 'Ruta Invalida',
            'origin_warehouse': self.warehouse.id,
            'transport': 99999,
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_invalid_warehouse(self):
        """POST /routes/ con origin_warehouse inexistente devuelve 400."""
        payload = {
            'name': 'Ruta Invalida',
            'origin_warehouse': 99999,
            'transport': self.transport.id,
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_route_not_found(self):
        """GET /routes/99999/ devuelve 404."""
        response = self.client.get('/api/v1/routes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_route_not_found(self):
        """PUT /routes/99999/ devuelve 404."""
        response = self.client.put('/api/v1/routes/99999/', self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_route_not_found(self):
        """DELETE /routes/99999/ devuelve 404."""
        response = self.client.delete('/api/v1/routes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_list(self):
        """GET /routes/ sin autenticacion devuelve 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create(self):
        """POST /routes/ sin autenticacion devuelve 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url_list, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve(self):
        """GET /routes/{id}/ sin autenticacion devuelve 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_delete(self):
        """DELETE /routes/{id}/ sin autenticacion devuelve 401."""
        self.client.force_authenticate(user=None)
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_list_routes_empty(self):
        """GET /routes/ sin rutas devuelve 200 con lista vacia."""
        Route.objects.all().delete()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_create_route_status_in_response(self):
        """La respuesta de creacion incluye el campo status con valor por defecto."""
        response = self.client.post(self.url_list, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], RouteStatus.PLANNED)

    def test_response_includes_timestamps(self):
        """La respuesta incluye created_at y updated_at."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_patch_only_name(self):
        """PATCH con solo name no modifica otros campos."""
        response = self.client.patch(self.url_detail, {'name': 'Nombre Cambiado'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Nombre Cambiado')
        # El status no cambio
        self.assertEqual(response.data['status'], 'planned')
