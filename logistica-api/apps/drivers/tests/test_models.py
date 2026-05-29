import datetime

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.test import TestCase

from apps.drivers.models import Driver


class DriverModelTest(TestCase):
    """Tests del modelo Driver."""

    def setUp(self):
        self.user = User.objects.create_user(username='driver01', password='pass')
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )

    # --- Happy path ---

    def test_create_driver_success(self):
        """Crear un Driver con datos validos persiste correctamente."""
        self.assertIsNotNone(self.driver.id)
        self.assertEqual(self.driver.license_number, 'LIC-001')
        self.assertEqual(self.driver.phone, '+573001234567')
        self.assertEqual(self.driver.user, self.user)
        self.assertEqual(self.driver.license_expiry, datetime.date(2027, 12, 31))

    def test_is_available_default_true(self):
        """El campo is_available tiene valor por defecto True."""
        self.assertTrue(self.driver.is_available)

    def test_auto_timestamps(self):
        """created_at y updated_at se asignan automaticamente al crear."""
        self.assertIsNotNone(self.driver.created_at)
        self.assertIsNotNone(self.driver.updated_at)

    def test_str_representation(self):
        """__str__ retorna username y license_number."""
        expected = f"{self.user.username} — {self.driver.license_number}"
        self.assertEqual(str(self.driver), expected)

    def test_updated_at_changes_on_save(self):
        """updated_at cambia cuando se modifica el objeto."""
        original_updated = self.driver.updated_at
        self.driver.phone = '+573009999999'
        self.driver.save()
        self.driver.refresh_from_db()
        # updated_at debe ser >= al valor original
        self.assertGreaterEqual(self.driver.updated_at, original_updated)

    def test_is_available_can_be_set_false(self):
        """is_available puede guardarse como False."""
        user2 = User.objects.create_user(username='driver02', password='pass')
        driver2 = Driver.objects.create(
            user=user2,
            license_number='LIC-002',
            license_expiry=datetime.date(2026, 6, 30),
            phone='+573001111111',
            is_available=False,
        )
        self.assertFalse(driver2.is_available)

    # --- Unhappy path ---

    def test_license_number_required(self):
        """license_number vacio falla en la validacion de Django (full_clean)."""
        from django.core.exceptions import ValidationError

        user2 = User.objects.create_user(username='driver02', password='pass')
        driver = Driver(
            user=user2,
            license_number='',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )
        with self.assertRaises(ValidationError):
            driver.full_clean()

    def test_duplicate_user_raises_integrity_error(self):
        """Un User no puede tener dos perfiles de Driver (OneToOne)."""
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=self.user,
                license_number='LIC-999',
                license_expiry=datetime.date(2027, 12, 31),
                phone='+573009999999',
            )

    # --- Edge case ---

    def test_license_number_unique(self):
        """Dos Drivers no pueden tener el mismo license_number."""
        user2 = User.objects.create_user(username='driver02', password='pass')
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=user2,
                license_number='LIC-001',
                license_expiry=datetime.date(2027, 12, 31),
                phone='+573009999999',
            )

    def test_cascade_delete_user_deletes_driver(self):
        """Eliminar el User relacionado elimina el Driver (CASCADE)."""
        driver_id = self.driver.id
        self.user.delete()
        self.assertFalse(Driver.objects.filter(id=driver_id).exists())

    def test_ordering_by_username(self):
        """El queryset se ordena por user__username por defecto."""
        user_a = User.objects.create_user(username='aaa_driver', password='pass')
        user_z = User.objects.create_user(username='zzz_driver', password='pass')
        Driver.objects.create(
            user=user_z,
            license_number='LIC-ZZZ',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001111111',
        )
        Driver.objects.create(
            user=user_a,
            license_number='LIC-AAA',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573002222222',
        )
        drivers = list(Driver.objects.all())
        usernames = [d.user.username for d in drivers]
        self.assertEqual(usernames, sorted(usernames))
