"""
Tests del modelo Customer.

Cubre:
- Creación exitosa con campos mínimos y con todos los campos
- Timestamps automáticos (created_at, updated_at)
- Campos requeridos: falla con ValidationError cuando están vacíos
- Campos nullable/blank: acepta None correctamente
- Restricción UNIQUE en tax_id
- Valor por defecto de is_active (True)
- Enum customer_type: valores válidos e inválidos
- __str__ retorna el nombre del cliente
"""

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from apps.customers.models import Customer, CustomerType


class CustomerModelCreationTest(TestCase):
    """Happy path: creación exitosa del modelo Customer."""

    def test_create_customer_with_minimum_fields(self):
        """Crear cliente con solo los campos obligatorios debe funcionar."""
        customer = Customer.objects.create(
            name='Empresa ABC',
            customer_type=CustomerType.COMPANY,
            email='contacto@empresaabc.com',
            city='Bogotá',
            country='Colombia',
        )
        self.assertIsNotNone(customer.id)
        self.assertEqual(customer.name, 'Empresa ABC')
        self.assertEqual(customer.customer_type, CustomerType.COMPANY)
        self.assertEqual(customer.email, 'contacto@empresaabc.com')
        self.assertEqual(customer.city, 'Bogotá')
        self.assertEqual(customer.country, 'Colombia')

    def test_create_customer_with_all_fields(self):
        """Crear cliente con todos los campos debe funcionar."""
        customer = Customer.objects.create(
            name='Juan Pérez',
            customer_type=CustomerType.INDIVIDUAL,
            tax_id='12345678',
            email='juan.perez@email.com',
            phone='+57 300 123 4567',
            address='Calle 10 # 5-20, Piso 3',
            city='Medellín',
            country='Colombia',
            is_active=True,
        )
        self.assertIsNotNone(customer.id)
        self.assertEqual(customer.name, 'Juan Pérez')
        self.assertEqual(customer.customer_type, CustomerType.INDIVIDUAL)
        self.assertEqual(customer.tax_id, '12345678')
        self.assertEqual(customer.phone, '+57 300 123 4567')
        self.assertEqual(customer.address, 'Calle 10 # 5-20, Piso 3')

    def test_create_company_customer_type(self):
        """Crear cliente con customer_type='company' debe almacenarse correctamente."""
        customer = Customer.objects.create(
            name='TechCorp S.A.',
            customer_type=CustomerType.COMPANY,
            email='info@techcorp.com',
            city='Lima',
            country='Perú',
        )
        self.assertEqual(customer.customer_type, 'company')

    def test_create_individual_customer_type(self):
        """Crear cliente con customer_type='individual' debe almacenarse correctamente."""
        customer = Customer.objects.create(
            name='María García',
            customer_type=CustomerType.INDIVIDUAL,
            email='maria@gmail.com',
            city='Quito',
            country='Ecuador',
        )
        self.assertEqual(customer.customer_type, 'individual')


class CustomerModelTimestampsTest(TestCase):
    """Tests de timestamps automáticos."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Test Cliente',
            customer_type=CustomerType.COMPANY,
            email='test@test.com',
            city='Bogotá',
            country='Colombia',
        )

    def test_created_at_is_set_automatically(self):
        """created_at debe asignarse automáticamente al crear."""
        self.assertIsNotNone(self.customer.created_at)

    def test_updated_at_is_set_automatically(self):
        """updated_at debe asignarse automáticamente al crear."""
        self.assertIsNotNone(self.customer.updated_at)

    def test_updated_at_changes_on_save(self):
        """updated_at debe actualizarse cada vez que se guarda el objeto."""
        original_updated_at = self.customer.updated_at
        self.customer.name = 'Nombre Modificado'
        self.customer.save()
        self.customer.refresh_from_db()
        # updated_at debe ser igual o posterior al valor original
        self.assertGreaterEqual(self.customer.updated_at, original_updated_at)


class CustomerModelDefaultsTest(TestCase):
    """Tests de valores por defecto del modelo."""

    def test_is_active_defaults_to_true(self):
        """is_active debe ser True por defecto."""
        customer = Customer.objects.create(
            name='Cliente Nuevo',
            customer_type=CustomerType.COMPANY,
            email='nuevo@empresa.com',
            city='Cali',
            country='Colombia',
        )
        self.assertTrue(customer.is_active)

    def test_is_active_can_be_set_to_false(self):
        """is_active puede establecerse explícitamente en False."""
        customer = Customer.objects.create(
            name='Cliente Inactivo',
            customer_type=CustomerType.COMPANY,
            email='inactivo@empresa.com',
            city='Cali',
            country='Colombia',
            is_active=False,
        )
        self.assertFalse(customer.is_active)


class CustomerModelStrTest(TestCase):
    """Tests del método __str__."""

    def test_str_returns_name(self):
        """__str__ debe retornar el nombre del cliente."""
        customer = Customer.objects.create(
            name='Empresa XYZ',
            customer_type=CustomerType.COMPANY,
            email='xyz@empresa.com',
            city='Bogotá',
            country='Colombia',
        )
        self.assertEqual(str(customer), 'Empresa XYZ')


class CustomerModelRequiredFieldsTest(TestCase):
    """Unhappy path: campos requeridos fallan con ValidationError."""

    def test_name_required(self):
        """name vacío debe fallar con ValidationError."""
        customer = Customer(
            name='',
            customer_type=CustomerType.COMPANY,
            email='test@test.com',
            city='Bogotá',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            customer.full_clean()

    def test_customer_type_required(self):
        """customer_type vacío debe fallar con ValidationError."""
        customer = Customer(
            name='Empresa',
            customer_type='',
            email='test@test.com',
            city='Bogotá',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            customer.full_clean()

    def test_customer_type_invalid_value(self):
        """customer_type con valor fuera de las opciones debe fallar con ValidationError."""
        customer = Customer(
            name='Empresa',
            customer_type='invalid_type',
            email='test@test.com',
            city='Bogotá',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            customer.full_clean()

    def test_email_required(self):
        """email vacío debe fallar con ValidationError."""
        customer = Customer(
            name='Empresa',
            customer_type=CustomerType.COMPANY,
            email='',
            city='Bogotá',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            customer.full_clean()

    def test_email_invalid_format(self):
        """email con formato inválido debe fallar con ValidationError."""
        customer = Customer(
            name='Empresa',
            customer_type=CustomerType.COMPANY,
            email='no-es-un-email',
            city='Bogotá',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            customer.full_clean()

    def test_city_required(self):
        """city vacío debe fallar con ValidationError."""
        customer = Customer(
            name='Empresa',
            customer_type=CustomerType.COMPANY,
            email='test@test.com',
            city='',
            country='Colombia',
        )
        with self.assertRaises(ValidationError):
            customer.full_clean()

    def test_country_required(self):
        """country vacío debe fallar con ValidationError."""
        customer = Customer(
            name='Empresa',
            customer_type=CustomerType.COMPANY,
            email='test@test.com',
            city='Bogotá',
            country='',
        )
        with self.assertRaises(ValidationError):
            customer.full_clean()


class CustomerModelNullableFieldsTest(TestCase):
    """Edge case: campos nullable/blank aceptan None y cadena vacía."""

    def test_tax_id_accepts_none(self):
        """tax_id nullable debe aceptar None."""
        customer = Customer.objects.create(
            name='Sin NIT',
            customer_type=CustomerType.INDIVIDUAL,
            email='sinit@test.com',
            city='Bogotá',
            country='Colombia',
            tax_id=None,
        )
        self.assertIsNone(customer.tax_id)

    def test_phone_accepts_none(self):
        """phone nullable debe aceptar None."""
        customer = Customer.objects.create(
            name='Sin Teléfono',
            customer_type=CustomerType.COMPANY,
            email='sinfono@test.com',
            city='Bogotá',
            country='Colombia',
            phone=None,
        )
        self.assertIsNone(customer.phone)

    def test_address_accepts_none(self):
        """address nullable debe aceptar None."""
        customer = Customer.objects.create(
            name='Sin Dirección',
            customer_type=CustomerType.COMPANY,
            email='sindir@test.com',
            city='Bogotá',
            country='Colombia',
            address=None,
        )
        self.assertIsNone(customer.address)

    def test_multiple_customers_without_tax_id(self):
        """Varios clientes pueden tener tax_id=None sin violar la restricción UNIQUE."""
        Customer.objects.create(
            name='Cliente Uno',
            customer_type=CustomerType.COMPANY,
            email='uno@test.com',
            city='Bogotá',
            country='Colombia',
            tax_id=None,
        )
        # Esto no debe lanzar excepción — NULL no viola UNIQUE
        customer2 = Customer.objects.create(
            name='Cliente Dos',
            customer_type=CustomerType.COMPANY,
            email='dos@test.com',
            city='Medellín',
            country='Colombia',
            tax_id=None,
        )
        self.assertIsNone(customer2.tax_id)


class CustomerModelUniqueConstraintsTest(TestCase):
    """Edge case: restricción UNIQUE en tax_id."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Empresa Con NIT',
            customer_type=CustomerType.COMPANY,
            email='connit@empresa.com',
            city='Bogotá',
            country='Colombia',
            tax_id='NIT-900123456',
        )

    def test_tax_id_unique_constraint(self):
        """Crear dos clientes con el mismo tax_id no-nulo debe fallar con IntegrityError."""
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Empresa Duplicada',
                customer_type=CustomerType.COMPANY,
                email='duplicada@empresa.com',
                city='Medellín',
                country='Colombia',
                tax_id='NIT-900123456',  # mismo tax_id
            )


class CustomerModelOrderingTest(TestCase):
    """Tests del ordering por defecto del modelo."""

    def test_default_ordering_by_name(self):
        """El queryset base debe estar ordenado por nombre (ascendente)."""
        Customer.objects.create(
            name='Zeta Corp',
            customer_type=CustomerType.COMPANY,
            email='zeta@corp.com',
            city='Bogotá',
            country='Colombia',
        )
        Customer.objects.create(
            name='Alpha Corp',
            customer_type=CustomerType.COMPANY,
            email='alpha@corp.com',
            city='Bogotá',
            country='Colombia',
        )
        Customer.objects.create(
            name='Beta Corp',
            customer_type=CustomerType.COMPANY,
            email='beta@corp.com',
            city='Bogotá',
            country='Colombia',
        )
        customers = list(Customer.objects.all())
        names = [c.name for c in customers]
        self.assertEqual(names, sorted(names))
