from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from django.test import TestCase

from apps.products.models import Product
from apps.suppliers.models import Supplier


class ProductModelTest(TestCase):
    """Tests del modelo Product."""

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Test Supplier',
            email='supplier@test.com',
            city='Bogota',
            country='Colombia',
        )
        self.product = Product.objects.create(
            name='Laptop Pro',
            sku='LAP-001',
            category='laptop',
            unit_price=Decimal('1500.00'),
            weight_kg=Decimal('2.500'),
            supplier=self.supplier,
        )

    # --- Happy path ---

    def test_create_product_with_required_fields_only(self):
        """Crear producto con campos minimos requeridos."""
        product = Product.objects.create(
            name='Monitor 24"',
            sku='MON-001',
            category='monitor',
            unit_price=Decimal('300.00'),
            weight_kg=Decimal('5.200'),
        )
        self.assertIsNotNone(product.id)
        self.assertEqual(product.name, 'Monitor 24"')
        self.assertEqual(product.sku, 'MON-001')
        self.assertEqual(product.category, 'monitor')
        self.assertEqual(product.unit_price, Decimal('300.00'))
        self.assertEqual(product.weight_kg, Decimal('5.200'))
        self.assertIsNone(product.supplier)
        self.assertIsNone(product.description)
        self.assertTrue(product.is_active)

    def test_create_product_with_all_fields(self):
        """Crear producto con todos los campos incluyendo opcionales."""
        product = Product.objects.create(
            name='Smartphone X',
            description='Ultimo modelo con camara 200MP',
            sku='SPH-001',
            category='smartphone',
            unit_price=Decimal('999.99'),
            weight_kg=Decimal('0.200'),
            supplier=self.supplier,
            is_active=True,
        )
        self.assertIsNotNone(product.id)
        self.assertEqual(product.description, 'Ultimo modelo con camara 200MP')
        self.assertEqual(product.supplier, self.supplier)

    def test_supplier_relation(self):
        """El producto referencia al proveedor correctamente."""
        self.assertEqual(self.product.supplier, self.supplier)
        self.assertEqual(self.product.supplier.name, 'Test Supplier')

    def test_timestamps_assigned_automatically(self):
        """created_at y updated_at se asignan automaticamente."""
        self.assertIsNotNone(self.product.created_at)
        self.assertIsNotNone(self.product.updated_at)

    def test_is_active_default_true(self):
        """is_active es True por defecto."""
        product = Product.objects.create(
            name='Tablet S',
            sku='TAB-001',
            category='tablet',
            unit_price=Decimal('450.00'),
            weight_kg=Decimal('0.800'),
        )
        self.assertTrue(product.is_active)

    def test_str_returns_name_and_sku(self):
        """__str__ retorna nombre y SKU."""
        expected = 'Laptop Pro (LAP-001)'
        self.assertEqual(str(self.product), expected)

    def test_decimal_precision_unit_price(self):
        """unit_price acepta dos decimales."""
        product = Product.objects.create(
            name='Server Blade',
            sku='SRV-001',
            category='server',
            unit_price=Decimal('12345.67'),
            weight_kg=Decimal('10.000'),
        )
        self.assertEqual(product.unit_price, Decimal('12345.67'))

    def test_decimal_precision_weight_kg(self):
        """weight_kg acepta tres decimales."""
        product = Product.objects.create(
            name='Cable USB',
            sku='CAB-001',
            category='accessory',
            unit_price=Decimal('5.00'),
            weight_kg=Decimal('0.050'),
        )
        self.assertEqual(product.weight_kg, Decimal('0.050'))

    # --- Unhappy path ---

    def test_name_required(self):
        """name vacio lanza ValidationError."""
        product = Product(
            name='',
            sku='SKU-TEST-001',
            category='laptop',
            unit_price=Decimal('100.00'),
            weight_kg=Decimal('1.000'),
        )
        with self.assertRaises(ValidationError):
            product.full_clean()

    def test_sku_required(self):
        """sku vacio lanza ValidationError."""
        product = Product(
            name='Test Product',
            sku='',
            category='laptop',
            unit_price=Decimal('100.00'),
            weight_kg=Decimal('1.000'),
        )
        with self.assertRaises(ValidationError):
            product.full_clean()

    def test_category_required(self):
        """category vacia lanza ValidationError."""
        product = Product(
            name='Test Product',
            sku='SKU-CAT-001',
            category='',
            unit_price=Decimal('100.00'),
            weight_kg=Decimal('1.000'),
        )
        with self.assertRaises(ValidationError):
            product.full_clean()

    def test_sku_unique_constraint(self):
        """No se pueden crear dos productos con el mismo SKU."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                name='Otro Laptop',
                sku='LAP-001',  # duplicado
                category='laptop',
                unit_price=Decimal('800.00'),
                weight_kg=Decimal('2.000'),
            )

    def test_delete_supplier_with_products_raises_protected_error(self):
        """Eliminar un proveedor con productos asociados lanza ProtectedError."""
        with self.assertRaises(ProtectedError):
            self.supplier.delete()

    # --- Edge cases ---

    def test_description_nullable(self):
        """description puede ser None."""
        product = Product.objects.create(
            name='Sin descripcion',
            sku='SKU-NULL-001',
            category='server',
            unit_price=Decimal('500.00'),
            weight_kg=Decimal('3.000'),
        )
        self.assertIsNone(product.description)

    def test_supplier_nullable(self):
        """supplier puede ser None — producto sin proveedor asignado."""
        product = Product.objects.create(
            name='Producto sin proveedor',
            sku='SKU-NOPROV-001',
            category='accessory',
            unit_price=Decimal('20.00'),
            weight_kg=Decimal('0.100'),
            supplier=None,
        )
        self.assertIsNone(product.supplier)

    def test_is_active_can_be_set_false(self):
        """is_active puede establecerse en False."""
        product = Product.objects.create(
            name='Producto Inactivo',
            sku='SKU-INACT-001',
            category='laptop',
            unit_price=Decimal('300.00'),
            weight_kg=Decimal('2.000'),
            is_active=False,
        )
        self.assertFalse(product.is_active)

    def test_unit_price_zero(self):
        """unit_price puede ser 0.00 — producto sin coste registrado."""
        product = Product.objects.create(
            name='Producto Gratuito',
            sku='SKU-FREE-001',
            category='accessory',
            unit_price=Decimal('0.00'),
            weight_kg=Decimal('0.010'),
        )
        self.assertEqual(product.unit_price, Decimal('0.00'))

    def test_ordering_by_name(self):
        """Los productos se ordenan por nombre por defecto."""
        Product.objects.create(
            name='Zeppelin Drive',
            sku='SKU-ORD-001',
            category='storage',
            unit_price=Decimal('200.00'),
            weight_kg=Decimal('0.500'),
        )
        Product.objects.create(
            name='Alpha SSD',
            sku='SKU-ORD-002',
            category='storage',
            unit_price=Decimal('150.00'),
            weight_kg=Decimal('0.080'),
        )
        products = list(
            Product.objects.filter(sku__in=['SKU-ORD-001', 'SKU-ORD-002']).values_list('name', flat=True)
        )
        self.assertEqual(products[0], 'Alpha SSD')
        self.assertEqual(products[1], 'Zeppelin Drive')
