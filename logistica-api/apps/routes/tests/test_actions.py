"""Tests de las acciones custom del ViewSet de Route.

Cubre:
  - GET  /api/v1/routes/{id}/stops/          — listar paradas
  - POST /api/v1/routes/{id}/stops/          — crear parada
  - GET  /api/v1/routes/{id}/stops/{stop_id}/  — detalle de parada
  - PUT  /api/v1/routes/{id}/stops/{stop_id}/  — reemplazar parada
  - PATCH /api/v1/routes/{id}/stops/{stop_id}/ — actualizar parada parcialmente
  - DELETE /api/v1/routes/{id}/stops/{stop_id}/— eliminar parada
"""
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.routes.models import Route, RouteStop
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


class RouteStopsListCreateTest(APITestCase):
    """Tests de GET y POST /api/v1/routes/{id}/stops/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse()
        self.transport = make_transport()
        self.route = Route.objects.create(
            name='Ruta Paradas',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )
        self.stops_url = f'/api/v1/routes/{self.route.id}/stops/'
        self.valid_stop_payload = {
            'stop_order': 1,
            'address': 'Av. El Dorado # 100',
            'city': 'Bogota',
        }

    # --- Happy path: GET stops ---

    def test_list_stops_empty(self):
        """GET stops de ruta sin paradas devuelve 200 con lista vacia."""
        response = self.client.get(self.stops_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_list_stops_with_data(self):
        """GET stops de ruta con paradas devuelve 200 con la lista ordenada."""
        RouteStop.objects.create(
            route=self.route, stop_order=2, address='Segunda Parada', city='Medellin'
        )
        RouteStop.objects.create(
            route=self.route, stop_order=1, address='Primera Parada', city='Bogota'
        )
        response = self.client.get(self.stops_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        # Las paradas deben estar ordenadas por stop_order ascendente
        self.assertEqual(response.data[0]['stop_order'], 1)
        self.assertEqual(response.data[1]['stop_order'], 2)

    def test_list_stops_response_includes_route_id(self):
        """Las paradas listadas incluyen el campo route con el id de la ruta."""
        RouteStop.objects.create(
            route=self.route, stop_order=1, address='Dir', city='Cali'
        )
        response = self.client.get(self.stops_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['route'], self.route.id)

    # --- Happy path: POST stops ---

    def test_create_stop_success(self):
        """POST stops con datos validos crea la parada y devuelve 201."""
        response = self.client.post(self.stops_url, self.valid_stop_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['stop_order'], 1)
        self.assertEqual(response.data['city'], 'Bogota')
        self.assertEqual(response.data['route'], self.route.id)

    def test_create_stop_persists_in_db(self):
        """POST stops crea el registro en la base de datos."""
        self.client.post(self.stops_url, self.valid_stop_payload)
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 1)

    def test_create_stop_with_optional_fields(self):
        """POST stops con coordenadas y tiempos opcionales devuelve 201."""
        payload = {
            **self.valid_stop_payload,
            'latitude': '4.710989',
            'longitude': '-74.072090',
            'estimated_arrival': '2026-06-01T10:00:00Z',
        }
        response = self.client.post(self.stops_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['latitude'])
        self.assertIsNotNone(response.data['longitude'])

    def test_create_multiple_stops_different_order(self):
        """POST varias paradas con stop_order distintos en la misma ruta devuelve 201 cada vez."""
        for order in [1, 2, 3]:
            response = self.client.post(self.stops_url, {
                'stop_order': order,
                'address': f'Parada {order}',
                'city': 'Bogota',
            })
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 3)

    # --- Unhappy path: GET stops ---

    def test_list_stops_route_not_found(self):
        """GET stops de ruta inexistente devuelve 404."""
        response = self.client.get('/api/v1/routes/99999/stops/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_stops_unauthenticated(self):
        """GET stops sin autenticacion devuelve 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.stops_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Unhappy path: POST stops ---

    def test_create_stop_duplicate_order_same_route(self):
        """POST stop con stop_order duplicado en la misma ruta devuelve 400."""
        self.client.post(self.stops_url, self.valid_stop_payload)
        # Segundo POST con el mismo stop_order
        response = self.client.post(self.stops_url, {
            'stop_order': 1,
            'address': 'Direccion diferente',
            'city': 'Medellin',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('stop_order', response.data)

    def test_create_stop_missing_stop_order(self):
        """POST stop sin stop_order devuelve 400."""
        payload = {
            'address': 'Av. El Dorado # 100',
            'city': 'Bogota',
        }
        response = self.client.post(self.stops_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_missing_address(self):
        """POST stop sin address devuelve 400."""
        payload = {
            'stop_order': 1,
            'city': 'Bogota',
        }
        response = self.client.post(self.stops_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_missing_city(self):
        """POST stop sin city devuelve 400."""
        payload = {
            'stop_order': 1,
            'address': 'Av. El Dorado # 100',
        }
        response = self.client.post(self.stops_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_route_not_found(self):
        """POST stop en ruta inexistente devuelve 404."""
        response = self.client.post('/api/v1/routes/99999/stops/', self.valid_stop_payload)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_stop_unauthenticated(self):
        """POST stops sin autenticacion devuelve 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.stops_url, self.valid_stop_payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_create_stop_same_order_different_route(self):
        """El mismo stop_order en una ruta distinta no viola unique_together — devuelve 201."""
        otra_ruta = Route.objects.create(
            name='Otra Ruta',
            origin_warehouse=self.warehouse,
            transport=make_transport(plate='T-002'),
        )
        # Crear stop con order=1 en la ruta principal
        self.client.post(self.stops_url, self.valid_stop_payload)
        # Crear stop con order=1 en OTRA ruta — no debe fallar
        url_otra = f'/api/v1/routes/{otra_ruta.id}/stops/'
        response = self.client.post(url_otra, {
            'stop_order': 1,
            'address': 'Dir en otra ruta',
            'city': 'Cali',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_stops_only_returns_stops_of_this_route(self):
        """GET stops solo devuelve paradas de la ruta solicitada, no de otras."""
        otra_ruta = Route.objects.create(
            name='Ruta Ajena',
            origin_warehouse=self.warehouse,
            transport=make_transport(plate='T-003'),
        )
        # Parada en la ruta principal
        RouteStop.objects.create(
            route=self.route, stop_order=1, address='Parada Mia', city='Bogota'
        )
        # Parada en otra ruta
        RouteStop.objects.create(
            route=otra_ruta, stop_order=1, address='Parada Ajena', city='Cali'
        )
        response = self.client.get(self.stops_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['address'], 'Parada Mia')


class RouteStopDetailTest(APITestCase):
    """Tests de GET/PUT/PATCH/DELETE /api/v1/routes/{id}/stops/{stop_id}/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser2', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse(name='Almacen B')
        self.transport = make_transport(plate='T-010')
        self.route = Route.objects.create(
            name='Ruta Detalle',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )
        self.stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Calle Principal 100',
            city='Cali',
        )
        self.stop_url = f'/api/v1/routes/{self.route.id}/stops/{self.stop.id}/'
        self.valid_stop_payload = {
            'stop_order': 1,
            'address': 'Calle Principal 100',
            'city': 'Cali',
        }

    # --- Happy path ---

    def test_retrieve_stop_success(self):
        """GET /routes/{id}/stops/{stop_id}/ devuelve 200 con datos de la parada."""
        response = self.client.get(self.stop_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.stop.id)
        self.assertEqual(response.data['city'], 'Cali')
        self.assertEqual(response.data['stop_order'], 1)

    def test_update_stop_put(self):
        """PUT /routes/{id}/stops/{stop_id}/ actualiza todos los campos y devuelve 200."""
        payload = {
            'stop_order': 1,
            'address': 'Avenida Nueva 500',
            'city': 'Barranquilla',
        }
        response = self.client.put(self.stop_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Barranquilla')
        self.assertEqual(response.data['address'], 'Avenida Nueva 500')

    def test_partial_update_stop_patch(self):
        """PATCH /routes/{id}/stops/{stop_id}/ actualiza solo los campos enviados."""
        response = self.client.patch(self.stop_url, {'city': 'Barranquilla'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Barranquilla')
        # El address no cambio
        self.assertEqual(response.data['address'], 'Calle Principal 100')

    def test_delete_stop_success(self):
        """DELETE /routes/{id}/stops/{stop_id}/ elimina la parada y devuelve 204."""
        response = self.client.delete(self.stop_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(RouteStop.objects.filter(id=self.stop.id).exists())

    def test_retrieve_stop_response_has_route(self):
        """El detalle de una parada incluye el campo route."""
        response = self.client.get(self.stop_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['route'], self.route.id)

    # --- Unhappy path ---

    def test_retrieve_stop_not_found(self):
        """GET /routes/{id}/stops/99999/ devuelve 404."""
        response = self.client.get(f'/api/v1/routes/{self.route.id}/stops/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_stop_route_not_found(self):
        """GET stops/{stop_id}/ con ruta inexistente devuelve 404."""
        response = self.client.get(f'/api/v1/routes/99999/stops/{self.stop.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_stop_duplicate_order_conflict(self):
        """PUT/PATCH con stop_order ya usado por otra parada en la misma ruta devuelve 400."""
        # Crear segunda parada con order=2
        RouteStop.objects.create(
            route=self.route, stop_order=2, address='Segunda', city='Bogota'
        )
        # Intentar cambiar la primera parada a order=2 (conflicto)
        response = self.client.patch(self.stop_url, {'stop_order': 2})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('stop_order', response.data)

    def test_delete_stop_route_not_found(self):
        """DELETE con ruta inexistente devuelve 404."""
        response = self.client.delete(f'/api/v1/routes/99999/stops/{self.stop.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_stop_unauthenticated(self):
        """GET detalle de parada sin autenticacion devuelve 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.stop_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_stop_unauthenticated(self):
        """PUT parada sin autenticacion devuelve 401."""
        self.client.force_authenticate(user=None)
        response = self.client.put(self.stop_url, self.valid_stop_payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_stop_unauthenticated(self):
        """DELETE parada sin autenticacion devuelve 401."""
        self.client.force_authenticate(user=None)
        response = self.client.delete(self.stop_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_stop_belongs_to_different_route_returns_404(self):
        """Si el stop_id no pertenece a la ruta indicada en la URL, devuelve 404."""
        otra_ruta = Route.objects.create(
            name='Ruta Otra',
            origin_warehouse=self.warehouse,
            transport=make_transport(plate='T-020'),
        )
        # Intentar acceder a la parada de self.route via otra_ruta
        url_cruzada = f'/api/v1/routes/{otra_ruta.id}/stops/{self.stop.id}/'
        response = self.client.get(url_cruzada)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_stop_add_coordinates(self):
        """PATCH puede agregar coordenadas a una parada que no las tenia."""
        response = self.client.patch(self.stop_url, {
            'latitude': '4.710989',
            'longitude': '-74.072090',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['latitude'])
        self.assertIsNotNone(response.data['longitude'])

    def test_update_stop_same_order_no_conflict(self):
        """PUT con el mismo stop_order que ya tiene la parada no lanza error de duplicado."""
        payload = {
            'stop_order': 1,  # mismo order que ya tiene
            'address': 'Direccion Actualizada',
            'city': 'Cali',
        }
        response = self.client.put(self.stop_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['address'], 'Direccion Actualizada')
