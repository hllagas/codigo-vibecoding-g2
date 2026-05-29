from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from django.test import TestCase

from apps.routes.models import Route, RouteStop
from apps.warehouses.models import Warehouse


class TestRouteModel(TestCase):
    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacen Central',
            code='AC-001',
            address='Av. Principal 123',
            city='Lima',
            state='Lima',
            country='Peru',
            capacity_m3=1000.00,
        )

    def _create_route(self, **kwargs):
        defaults = {
            'name': 'Ruta Lima Norte',
            'origin_warehouse': self.warehouse,
            'estimated_duration_hours': '3.50',
        }
        defaults.update(kwargs)
        return Route.objects.create(**defaults)

    def test_create_route(self):
        route = self._create_route()
        self.assertEqual(route.name, 'Ruta Lima Norte')
        self.assertEqual(route.origin_warehouse, self.warehouse)
        self.assertEqual(str(route.estimated_duration_hours), '3.50')
        self.assertTrue(route.is_active)
        self.assertIsNotNone(route.created_at)
        self.assertIsNotNone(route.updated_at)

    def test_str_retorna_name(self):
        route = self._create_route()
        self.assertEqual(str(route), 'Ruta Lima Norte')

    def test_is_active_default_true(self):
        route = self._create_route()
        self.assertTrue(route.is_active)

    def test_origin_warehouse_protect(self):
        self._create_route()
        with self.assertRaises(ProtectedError):
            self.warehouse.delete()


class TestRouteStopModel(TestCase):
    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacen Sur',
            code='AS-001',
            address='Jr. Los Pinos 456',
            city='Lima',
            state='Lima',
            country='Peru',
            capacity_m3=500.00,
        )
        self.route = Route.objects.create(
            name='Ruta Lima Sur',
            origin_warehouse=self.warehouse,
            estimated_duration_hours='2.00',
        )

    def _create_stop(self, **kwargs):
        defaults = {
            'route': self.route,
            'order': 1,
            'address': 'Av. Universitaria 1234',
            'city': 'Lima',
        }
        defaults.update(kwargs)
        return RouteStop.objects.create(**defaults)

    def test_create_routestop(self):
        stop = self._create_stop()
        self.assertEqual(stop.route, self.route)
        self.assertEqual(stop.order, 1)
        self.assertEqual(stop.address, 'Av. Universitaria 1234')
        self.assertEqual(stop.city, 'Lima')
        self.assertIsNone(stop.latitude)
        self.assertIsNone(stop.longitude)

    def test_str_incluye_order_city_route(self):
        stop = self._create_stop()
        result = str(stop)
        self.assertIn('1', result)
        self.assertIn('Lima', result)
        self.assertIn('Ruta Lima Sur', result)

    def test_cascade_delete_on_route_delete(self):
        stop = self._create_stop()
        route_id = self.route.id
        self.route.delete()
        self.assertEqual(RouteStop.objects.filter(route_id=route_id).count(), 0)

    def test_unique_together_order_route(self):
        self._create_stop(order=1)
        with self.assertRaises(IntegrityError):
            self._create_stop(order=1)

    def test_latitude_longitude_nullable(self):
        stop = self._create_stop(latitude=None, longitude=None)
        self.assertIsNone(stop.latitude)
        self.assertIsNone(stop.longitude)
