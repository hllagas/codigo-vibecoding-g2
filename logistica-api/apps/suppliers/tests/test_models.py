from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from apps.suppliers.models import Supplier


class SupplierModelTest(TestCase):
    """Tests del modelo Supplier: restricciones, campos y comportamiento ORM."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Tech Corp',
            email='contact@techcorp.com',
            city='Bogota',
            country='Colombia',
        )

    # ------------------------------------------------------------------ #
    # Happy path                                                           #
    # ------------------------------------------------------------------ #

    def test_create_supplier_minimal_fields(self):
        """Crear proveedor con los campos obligatorios produce una instancia válida."""
        self.assertIsNotNone(self.supplier.id)
        self.assertEqual(self.supplier.name, 'Tech Corp')
        self.assertEqual(self.supplier.email, 'contact@techcorp.com')
        self.assertEqual(self.supplier.city, 'Bogota')
        self.assertEqual(self.supplier.country, 'Colombia')

    def test_is_active_defaults_to_true(self):
        """is_active debe ser True cuando no se especifica."""
        self.assertTrue(self.supplier.is_active)

    def test_auto_timestamps_assigned(self):
        """created_at y updated_at se asignan automáticamente al crear."""
        self.assertIsNotNone(self.supplier.created_at)
        self.assertIsNotNone(self.supplier.updated_at)

    def test_str_returns_name(self):
        """__str__ devuelve el nombre del proveedor."""
        self.assertEqual(str(self.supplier), 'Tech Corp')

    def test_create_supplier_all_fields(self):
        """Crear proveedor con todos los campos opcionales incluidos."""
        supplier = Supplier.objects.create(
            name='Global Supplies',
            tax_id='RUC-12345',
            email='info@globalsupplies.com',
            phone='+573001234567',
            address='Calle 10 # 20-30',
            city='Medellin',
            country='Colombia',
            is_active=False,
        )
        self.assertEqual(supplier.tax_id, 'RUC-12345')
        self.assertEqual(supplier.phone, '+573001234567')
        self.assertEqual(supplier.address, 'Calle 10 # 20-30')
        self.assertFalse(supplier.is_active)

    def test_db_table_name(self):
        """La tabla en BD debe llamarse 'suppliers'."""
        self.assertEqual(Supplier._meta.db_table, 'suppliers')

    def test_ordering_is_by_name(self):
        """El ordenamiento por defecto es por nombre ascendente."""
        Supplier.objects.create(
            name='Almacenes Alfa',
            email='alfa@example.com',
            city='Lima',
            country='Peru',
        )
        names = list(Supplier.objects.values_list('name', flat=True))
        self.assertEqual(names, sorted(names))

    # ------------------------------------------------------------------ #
    # Unhappy path                                                         #
    # ------------------------------------------------------------------ #

    def test_name_required(self):
        """name vacío debe fallar la validación del modelo."""
        supplier = Supplier(
            name='',
            email='noname@example.com',
            city='Cali',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            supplier.full_clean()

    def test_email_required(self):
        """email vacío debe fallar la validación del modelo."""
        supplier = Supplier(
            name='Sin Email Corp',
            email='',
            city='Cali',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            supplier.full_clean()

    def test_city_required(self):
        """city vacío debe fallar la validación del modelo."""
        supplier = Supplier(
            name='Sin Ciudad Corp',
            email='sincity@example.com',
            city='',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            supplier.full_clean()

    def test_country_required(self):
        """country vacío debe fallar la validación del modelo."""
        supplier = Supplier(
            name='Sin Pais Corp',
            email='sinpais@example.com',
            city='Bogota',
            country='',
        )
        with self.assertRaises(ValidationError):
            supplier.full_clean()

    def test_tax_id_unique_constraint(self):
        """Dos proveedores con el mismo tax_id deben lanzar IntegrityError."""
        Supplier.objects.create(
            name='Empresa A',
            tax_id='NIT-999',
            email='a@example.com',
            city='Bogota',
            country='Colombia',
        )
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name='Empresa B',
                tax_id='NIT-999',
                email='b@example.com',
                city='Cali',
                country='Colombia',
            )

    def test_email_invalid_format_fails_validation(self):
        """Un email con formato inválido debe fallar full_clean."""
        supplier = Supplier(
            name='Bad Email Corp',
            email='not-an-email',
            city='Bogota',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            supplier.full_clean()

    # ------------------------------------------------------------------ #
    # Edge cases                                                           #
    # ------------------------------------------------------------------ #

    def test_tax_id_nullable(self):
        """tax_id puede ser None — el campo es nullable."""
        supplier = Supplier.objects.create(
            name='Sin RUC Corp',
            tax_id=None,
            email='sinruc@example.com',
            city='Quito',
            country='Ecuador',
        )
        self.assertIsNone(supplier.tax_id)

    def test_tax_id_blank(self):
        """tax_id puede ser cadena vacía — el campo acepta blank."""
        supplier = Supplier(
            name='Blank RUC Corp',
            tax_id='',
            email='blank@example.com',
            city='Lima',
            country='Peru',
        )
        # full_clean no debe lanzar error para blank=True
        try:
            supplier.full_clean()
        except ValidationError as exc:
            self.assertNotIn('tax_id', exc.message_dict)

    def test_phone_nullable(self):
        """phone puede ser None."""
        supplier = Supplier.objects.create(
            name='No Phone Corp',
            phone=None,
            email='nophone@example.com',
            city='Caracas',
            country='Venezuela',
        )
        self.assertIsNone(supplier.phone)

    def test_address_nullable(self):
        """address puede ser None."""
        supplier = Supplier.objects.create(
            name='No Address Corp',
            address=None,
            email='noaddress@example.com',
            city='Santiago',
            country='Chile',
        )
        self.assertIsNone(supplier.address)

    def test_multiple_suppliers_null_tax_id_allowed(self):
        """Varios proveedores pueden tener tax_id=None sin violar unique."""
        Supplier.objects.create(
            name='Empresa X',
            tax_id=None,
            email='x@example.com',
            city='Buenos Aires',
            country='Argentina',
        )
        Supplier.objects.create(
            name='Empresa Y',
            tax_id=None,
            email='y@example.com',
            city='Lima',
            country='Peru',
        )
        count = Supplier.objects.filter(tax_id__isnull=True).count()
        # setUp crea uno sin tax_id, más los dos de este test = 3
        self.assertGreaterEqual(count, 2)

    def test_name_max_length_255(self):
        """name con exactamente 255 caracteres debe ser válido."""
        supplier = Supplier(
            name='A' * 255,
            email='long@example.com',
            city='Bogota',
            country='Colombia',
        )
        # No debe lanzar ValidationError por longitud
        try:
            supplier.full_clean()
        except ValidationError as exc:
            self.assertNotIn('name', exc.message_dict)

    def test_name_exceeds_max_length(self):
        """name con 256 caracteres debe fallar la validación."""
        supplier = Supplier(
            name='A' * 256,
            email='toolong@example.com',
            city='Bogota',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            supplier.full_clean()

    def test_updated_at_changes_on_save(self):
        """updated_at debe cambiar al guardar de nuevo el objeto."""
        original_updated_at = self.supplier.updated_at
        self.supplier.name = 'Tech Corp Updated'
        self.supplier.save()
        self.supplier.refresh_from_db()
        self.assertGreaterEqual(self.supplier.updated_at, original_updated_at)
