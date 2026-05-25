import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.drivers.models import Driver
from apps.routes.models import Route, RouteStatus, RouteStop
from apps.transports.models import Transport, TransportType
from apps.warehouses.models import Warehouse


def make_warehouse(name='Almacén Test', **kwargs):
    return Warehouse.objects.create(
        name=name,
        address='Calle 1',
        city='Bogotá',
        country='Colombia',
        capacity=1000,
        **kwargs,
    )


def make_transport(plate='T-001', **kwargs):
    return Transport.objects.create(
        name='Camión Test',
        plate_number=plate,
        transport_type=TransportType.TRUCK,
        capacity_kg=Decimal('1000.00'),
        **kwargs,
    )


class RouteModelTest(TestCase):
    def setUp(self):
        self.warehouse = make_warehouse()
        self.transport = make_transport()

    def test_create_route(self):
        route = Route.objects.create(
            name='Ruta Norte',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )
        self.assertEqual(route.name, 'Ruta Norte')
        self.assertEqual(route.status, RouteStatus.PLANNED)

    def test_status_default_planned(self):
        route = Route.objects.create(
            name='Ruta Sur',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )
        self.assertEqual(route.status, 'planned')

    def test_create_route_stop(self):
        route = Route.objects.create(
            name='Ruta Este',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )
        stop = RouteStop.objects.create(
            route=route,
            stop_order=1,
            address='Carrera 10 # 20-30',
            city='Medellín',
        )
        self.assertEqual(stop.stop_order, 1)
        self.assertEqual(stop.route, route)

    def test_route_stop_unique_together(self):
        route = Route.objects.create(
            name='Ruta Oeste',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )
        RouteStop.objects.create(route=route, stop_order=1, address='Dir 1', city='Cali')
        with self.assertRaises(IntegrityError):
            RouteStop.objects.create(route=route, stop_order=1, address='Dir 2', city='Cali')

    def test_delete_route_cascades_stops(self):
        route = Route.objects.create(
            name='Ruta Temporal',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )
        RouteStop.objects.create(route=route, stop_order=1, address='Dir', city='Bogotá')
        route_id = route.id
        route.delete()
        self.assertFalse(RouteStop.objects.filter(route_id=route_id).exists())


class RouteViewSetTest(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='admin', password='pass')
        self.client.force_authenticate(user=self.auth_user)
        self.warehouse = make_warehouse()
        self.transport = make_transport()
        self.route = Route.objects.create(
            name='Ruta Principal',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )

    def test_list_routes(self):
        response = self.client.get('/api/v1/routes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_route(self):
        response = self.client.post('/api/v1/routes/', {
            'name': 'Ruta Nueva',
            'origin_warehouse': self.warehouse.id,
            'transport': self.transport.id,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'planned')

    def test_create_route_invalid(self):
        response = self.client.post('/api/v1/routes/', {'name': 'Sin deps'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_route(self):
        response = self.client.get(f'/api/v1/routes/{self.route.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_route_not_found(self):
        response = self.client.get('/api/v1/routes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_by_status(self):
        response = self.client.get('/api/v1/routes/?status=planned')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['status'], 'planned')

    def test_patch_route(self):
        response = self.client.patch(
            f'/api/v1/routes/{self.route.id}/',
            {'status': 'in_progress'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_progress')

    def test_delete_route(self):
        response = self.client.delete(f'/api/v1/routes/{self.route.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # --- stops nested actions ---

    def test_list_stops_empty(self):
        response = self.client.get(f'/api/v1/routes/{self.route.id}/stops/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_create_stop(self):
        response = self.client.post(f'/api/v1/routes/{self.route.id}/stops/', {
            'stop_order': 1,
            'address': 'Av. El Dorado # 100',
            'city': 'Bogotá',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['stop_order'], 1)
        self.assertEqual(response.data['route'], self.route.id)

    def test_create_stop_duplicate_order(self):
        self.client.post(f'/api/v1/routes/{self.route.id}/stops/', {
            'stop_order': 1,
            'address': 'Dir A',
            'city': 'Bogotá',
        })
        response = self.client.post(f'/api/v1/routes/{self.route.id}/stops/', {
            'stop_order': 1,
            'address': 'Dir B',
            'city': 'Medellín',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_stop(self):
        stop = RouteStop.objects.create(
            route=self.route, stop_order=1, address='Dir', city='Cali'
        )
        response = self.client.get(f'/api/v1/routes/{self.route.id}/stops/{stop.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Cali')

    def test_retrieve_stop_not_found(self):
        response = self.client.get(f'/api/v1/routes/{self.route.id}/stops/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_stop(self):
        stop = RouteStop.objects.create(
            route=self.route, stop_order=1, address='Dir', city='Cali'
        )
        response = self.client.patch(
            f'/api/v1/routes/{self.route.id}/stops/{stop.id}/',
            {'city': 'Barranquilla'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Barranquilla')

    def test_delete_stop(self):
        stop = RouteStop.objects.create(
            route=self.route, stop_order=1, address='Dir', city='Cali'
        )
        response = self.client.delete(f'/api/v1/routes/{self.route.id}/stops/{stop.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/routes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
