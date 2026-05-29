"""Tests de modelos Route y RouteStop."""
from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase

from apps.routes.models import Route, RouteStatus, RouteStop
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


class RouteModelTest(TestCase):
    """Tests del modelo Route."""

    def setUp(self):
        self.warehouse = make_warehouse()
        self.transport = make_transport()
        self.route = Route.objects.create(
            name='Ruta Norte',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )

    # --- Happy path ---

    def test_create_route_success(self):
        """Crear ruta con datos validos asigna id y nombre."""
        self.assertIsNotNone(self.route.id)
        self.assertEqual(self.route.name, 'Ruta Norte')

    def test_status_default_planned(self):
        """El status por defecto es 'planned'."""
        self.assertEqual(self.route.status, RouteStatus.PLANNED)
        self.assertEqual(self.route.status, 'planned')

    def test_auto_timestamps(self):
        """created_at y updated_at se asignan automaticamente."""
        self.assertIsNotNone(self.route.created_at)
        self.assertIsNotNone(self.route.updated_at)

    def test_str_representation(self):
        """__str__ retorna nombre y status entre corchetes."""
        expected = f"Ruta Norte [planned]"
        self.assertEqual(str(self.route), expected)

    def test_fk_to_warehouse(self):
        """Route tiene FK a Warehouse correctamente asignada."""
        self.assertEqual(self.route.origin_warehouse, self.warehouse)

    def test_fk_to_transport(self):
        """Route tiene FK a Transport correctamente asignada."""
        self.assertEqual(self.route.transport, self.transport)

    # --- Unhappy path ---

    def test_name_required(self):
        """No se puede crear Route sin nombre — el campo no permite blank a nivel DB."""
        route = Route(
            name='',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )
        # CharField sin blank=True falla en full_clean pero no necesariamente en DB.
        # Verificamos con full_clean.
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            route.full_clean()

    def test_protect_transport_cannot_delete_with_routes(self):
        """Eliminar Transport con rutas asociadas lanza ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.transport.delete()

    def test_protect_warehouse_cannot_delete_with_routes(self):
        """Eliminar Warehouse con rutas asociadas lanza ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.warehouse.delete()

    # --- Edge cases ---

    def test_nullable_estimated_duration_hours(self):
        """estimated_duration_hours es nullable y acepta None."""
        self.assertIsNone(self.route.estimated_duration_hours)

    def test_estimated_duration_hours_with_value(self):
        """estimated_duration_hours acepta valores decimales."""
        route = Route.objects.create(
            name='Ruta Corta',
            origin_warehouse=self.warehouse,
            transport=make_transport(plate='T-002'),
            estimated_duration_hours=Decimal('3.50'),
        )
        self.assertEqual(route.estimated_duration_hours, Decimal('3.50'))

    def test_nullable_started_at(self):
        """started_at es nullable."""
        self.assertIsNone(self.route.started_at)

    def test_nullable_completed_at(self):
        """completed_at es nullable."""
        self.assertIsNone(self.route.completed_at)

    def test_valid_status_choices(self):
        """Los cuatro valores de status son aceptados."""
        for status_val in ['planned', 'in_progress', 'completed', 'cancelled']:
            route = Route.objects.create(
                name=f'Ruta {status_val}',
                origin_warehouse=self.warehouse,
                transport=make_transport(plate=f'T-{status_val}'),
                status=status_val,
            )
            self.assertEqual(route.status, status_val)

    def test_ordering_by_created_at_desc(self):
        """Las rutas se ordenan por created_at descendente por defecto."""
        route2 = Route.objects.create(
            name='Ruta Segunda',
            origin_warehouse=self.warehouse,
            transport=make_transport(plate='T-003'),
        )
        rutas = list(Route.objects.all())
        # La mas reciente debe estar primero
        self.assertEqual(rutas[0], route2)
        self.assertEqual(rutas[1], self.route)


class RouteStopModelTest(TestCase):
    """Tests del modelo RouteStop."""

    def setUp(self):
        self.warehouse = make_warehouse()
        self.transport = make_transport()
        self.route = Route.objects.create(
            name='Ruta Base',
            origin_warehouse=self.warehouse,
            transport=self.transport,
        )
        self.stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Carrera 10 # 20-30',
            city='Medellin',
        )

    # --- Happy path ---

    def test_create_stop_success(self):
        """Crear RouteStop con datos validos."""
        self.assertIsNotNone(self.stop.id)
        self.assertEqual(self.stop.stop_order, 1)
        self.assertEqual(self.stop.city, 'Medellin')

    def test_stop_fk_to_route(self):
        """RouteStop referencia correctamente a su Route."""
        self.assertEqual(self.stop.route, self.route)

    def test_multiple_stops_different_order(self):
        """Se pueden crear multiples paradas con stop_order distintos en la misma ruta."""
        stop2 = RouteStop.objects.create(
            route=self.route, stop_order=2, address='Dir 2', city='Cali'
        )
        stop3 = RouteStop.objects.create(
            route=self.route, stop_order=3, address='Dir 3', city='Bogota'
        )
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 3)

    def test_same_stop_order_different_routes(self):
        """El mismo stop_order en rutas distintas no viola unique_together."""
        otra_ruta = Route.objects.create(
            name='Otra Ruta',
            origin_warehouse=self.warehouse,
            transport=make_transport(plate='T-002'),
        )
        stop_otra = RouteStop.objects.create(
            route=otra_ruta, stop_order=1, address='Dir en otra ruta', city='Bogota'
        )
        self.assertEqual(stop_otra.stop_order, 1)

    def test_ordering_by_stop_order(self):
        """Las paradas se ordenan por stop_order ascendente."""
        RouteStop.objects.create(
            route=self.route, stop_order=3, address='Ultima', city='Cali'
        )
        RouteStop.objects.create(
            route=self.route, stop_order=2, address='Segunda', city='Barranquilla'
        )
        paradas = list(RouteStop.objects.filter(route=self.route))
        self.assertEqual(paradas[0].stop_order, 1)
        self.assertEqual(paradas[1].stop_order, 2)
        self.assertEqual(paradas[2].stop_order, 3)

    # --- Unhappy path ---

    def test_unique_together_route_stop_order(self):
        """No se pueden crear dos paradas con el mismo stop_order en la misma ruta."""
        with self.assertRaises(IntegrityError):
            RouteStop.objects.create(
                route=self.route, stop_order=1, address='Dir duplicada', city='Bogota'
            )

    def test_address_required(self):
        """address es requerido — full_clean lanza ValidationError si esta vacio."""
        from django.core.exceptions import ValidationError
        stop = RouteStop(route=self.route, stop_order=99, address='', city='Bogota')
        with self.assertRaises(ValidationError):
            stop.full_clean()

    def test_city_required(self):
        """city es requerido — full_clean lanza ValidationError si esta vacio."""
        from django.core.exceptions import ValidationError
        stop = RouteStop(route=self.route, stop_order=99, address='Dir', city='')
        with self.assertRaises(ValidationError):
            stop.full_clean()

    def test_delete_route_cascades_stops(self):
        """Eliminar Route elimina en cascada sus RouteStops."""
        route_id = self.route.id
        self.route.delete()
        self.assertFalse(RouteStop.objects.filter(route_id=route_id).exists())

    # --- Edge cases ---

    def test_nullable_latitude(self):
        """latitude acepta None."""
        self.assertIsNone(self.stop.latitude)

    def test_nullable_longitude(self):
        """longitude acepta None."""
        self.assertIsNone(self.stop.longitude)

    def test_nullable_estimated_arrival(self):
        """estimated_arrival acepta None."""
        self.assertIsNone(self.stop.estimated_arrival)

    def test_nullable_actual_arrival(self):
        """actual_arrival acepta None."""
        self.assertIsNone(self.stop.actual_arrival)

    def test_stop_with_coordinates(self):
        """RouteStop acepta coordenadas geograficas validas."""
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=10,
            address='Av Siempre Viva 742',
            city='Springfield',
            latitude=Decimal('4.710989'),
            longitude=Decimal('-74.072090'),
        )
        self.assertEqual(stop.latitude, Decimal('4.710989'))
        self.assertEqual(stop.longitude, Decimal('-74.072090'))
