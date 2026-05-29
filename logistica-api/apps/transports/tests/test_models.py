import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from apps.drivers.models import Driver
from apps.transports.models import Transport, TransportType


class TransportModelTest(TestCase):
    """Tests del modelo Transport: restricciones, defaults, relaciones."""

    def setUp(self):
        self.user = User.objects.create_user(username='driver01', password='pass')
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )
        self.transport = Transport.objects.create(
            name='Camion Norte',
            plate_number='ABC-123',
            transport_type=TransportType.TRUCK,
            capacity_kg=Decimal('1000.00'),
        )

    # --- Happy path ---

    def test_create_transport_without_driver(self):
        """Crear un transporte sin conductor asigna driver=None."""
        transport = Transport.objects.create(
            name='Van Sur',
            plate_number='VAN-001',
            transport_type=TransportType.VAN,
            capacity_kg=Decimal('500.00'),
        )
        self.assertIsNotNone(transport.id)
        self.assertIsNone(transport.driver)

    def test_create_transport_with_driver(self):
        """Crear un transporte con conductor lo referencia correctamente."""
        transport = Transport.objects.create(
            name='Moto Este',
            plate_number='MOT-001',
            transport_type=TransportType.MOTORCYCLE,
            capacity_kg=Decimal('50.00'),
            driver=self.driver,
        )
        self.assertEqual(transport.driver, self.driver)

    def test_is_active_defaults_to_true(self):
        """El campo is_active debe ser True por defecto."""
        transport = Transport.objects.create(
            name='Bici Oeste',
            plate_number='BIC-001',
            transport_type=TransportType.BICYCLE,
            capacity_kg=Decimal('20.00'),
        )
        self.assertTrue(transport.is_active)

    def test_auto_timestamps_assigned(self):
        """created_at y updated_at se asignan automaticamente al crear."""
        self.assertIsNotNone(self.transport.created_at)
        self.assertIsNotNone(self.transport.updated_at)

    def test_str_method(self):
        """__str__ retorna nombre y placa del transporte."""
        expected = f"{self.transport.name} ({self.transport.plate_number})"
        self.assertEqual(str(self.transport), expected)

    def test_all_valid_transport_types(self):
        """Todos los valores del enum TransportType son validos."""
        plates = ['T-TRUCK', 'T-VAN', 'T-MOTO', 'T-BICI']
        types = [
            TransportType.TRUCK,
            TransportType.VAN,
            TransportType.MOTORCYCLE,
            TransportType.BICYCLE,
        ]
        for plate, transport_type in zip(plates, types):
            transport = Transport.objects.create(
                name=f'Vehiculo {plate}',
                plate_number=plate,
                transport_type=transport_type,
                capacity_kg=Decimal('100.00'),
            )
            transport.full_clean()  # no debe lanzar excepcion

    # --- Unhappy path ---

    def test_plate_number_unique_constraint(self):
        """No se pueden crear dos transportes con la misma placa."""
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                name='Duplicado',
                plate_number='ABC-123',  # igual que setUp
                transport_type=TransportType.VAN,
                capacity_kg=Decimal('500.00'),
            )

    def test_name_required(self):
        """El campo name no puede estar vacio."""
        transport = Transport(
            name='',
            plate_number='NEW-001',
            transport_type=TransportType.VAN,
            capacity_kg=Decimal('500.00'),
        )
        with self.assertRaises(ValidationError):
            transport.full_clean()

    def test_plate_number_required(self):
        """El campo plate_number no puede estar vacio."""
        transport = Transport(
            name='Sin Placa',
            plate_number='',
            transport_type=TransportType.TRUCK,
            capacity_kg=Decimal('1000.00'),
        )
        with self.assertRaises(ValidationError):
            transport.full_clean()

    def test_invalid_transport_type_rejected(self):
        """Un valor de transport_type fuera del enum lanza ValidationError."""
        transport = Transport(
            name='Helicoptero',
            plate_number='HEL-001',
            transport_type='helicopter',
            capacity_kg=Decimal('500.00'),
        )
        with self.assertRaises(ValidationError):
            transport.full_clean()

    # --- Edge case ---

    def test_set_null_on_driver_delete(self):
        """Cuando se elimina el Driver, el FK en Transport pasa a NULL (SET_NULL)."""
        transport = Transport.objects.create(
            name='Van Este',
            plate_number='VAN-002',
            transport_type=TransportType.VAN,
            capacity_kg=Decimal('500.00'),
            driver=self.driver,
        )
        self.driver.delete()
        transport.refresh_from_db()
        self.assertIsNone(transport.driver)

    def test_can_deactivate_transport(self):
        """Un transporte puede marcarse como inactivo."""
        self.transport.is_active = False
        self.transport.save()
        self.transport.refresh_from_db()
        self.assertFalse(self.transport.is_active)

    def test_driver_field_nullable_in_db(self):
        """El campo driver acepta NULL explicitamente."""
        transport = Transport.objects.create(
            name='Camion Libre',
            plate_number='LIB-001',
            transport_type=TransportType.TRUCK,
            capacity_kg=Decimal('800.00'),
            driver=None,
        )
        self.assertIsNone(transport.driver)
        transport.full_clean()  # no debe lanzar excepcion por driver=None
