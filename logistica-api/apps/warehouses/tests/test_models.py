from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.warehouses.models import Warehouse, WarehouseStock
from apps.products.models import Product


class WarehouseModelTest(TestCase):
    """Tests del modelo Warehouse."""

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacen Central',
            address='Calle 123 # 45-67',
            city='Bogota',
            country='Colombia',
            capacity=1000,
        )

    # --- Happy path ---

    def test_create_warehouse_success(self):
        """Crear un almacen con datos validos genera una instancia persistida."""
        self.assertIsNotNone(self.warehouse.id)
        self.assertEqual(self.warehouse.name, 'Almacen Central')
        self.assertEqual(self.warehouse.address, 'Calle 123 # 45-67')
        self.assertEqual(self.warehouse.city, 'Bogota')
        self.assertEqual(self.warehouse.country, 'Colombia')
        self.assertEqual(self.warehouse.capacity, 1000)

    def test_is_active_defaults_to_true(self):
        """is_active debe ser True por defecto al crear un almacen."""
        self.assertTrue(self.warehouse.is_active)

    def test_auto_timestamps_on_create(self):
        """created_at y updated_at se asignan automaticamente al crear."""
        self.assertIsNotNone(self.warehouse.created_at)
        self.assertIsNotNone(self.warehouse.updated_at)

    def test_str_representation(self):
        """__str__ retorna el nombre del almacen."""
        self.assertEqual(str(self.warehouse), 'Almacen Central')

    def test_create_warehouse_with_coordinates(self):
        """Crear almacen con latitud y longitud opcionales."""
        warehouse = Warehouse.objects.create(
            name='Almacen Norte',
            address='Carrera 10 # 20-30',
            city='Medellin',
            country='Colombia',
            capacity=500,
            latitude='6.244203',
            longitude='-75.581211',
        )
        self.assertIsNotNone(warehouse.id)
        self.assertIsNotNone(warehouse.latitude)
        self.assertIsNotNone(warehouse.longitude)

    # --- Edge cases: campos nullable ---

    def test_latitude_accepts_null(self):
        """latitude es nullable — debe aceptar None."""
        warehouse = Warehouse.objects.create(
            name='Sin Coordenadas',
            address='Direccion sin GPS',
            city='Cali',
            country='Colombia',
            capacity=200,
            latitude=None,
            longitude=None,
        )
        self.assertIsNone(warehouse.latitude)
        self.assertIsNone(warehouse.longitude)

    def test_longitude_accepts_null(self):
        """longitude es nullable independientemente de latitude."""
        warehouse = Warehouse.objects.create(
            name='Solo Latitud',
            address='Direccion cualquiera',
            city='Barranquilla',
            country='Colombia',
            capacity=300,
            latitude='10.963889',
            longitude=None,
        )
        self.assertIsNone(warehouse.longitude)

    # --- Unhappy path: campos requeridos ---

    def test_name_required(self):
        """name no puede estar vacio."""
        obj = Warehouse(
            name='',
            address='Calle 1',
            city='Bogota',
            country='Colombia',
            capacity=100,
        )
        with self.assertRaises(ValidationError):
            obj.full_clean()

    def test_address_required(self):
        """address no puede estar vacio."""
        obj = Warehouse(
            name='Almacen Test',
            address='',
            city='Bogota',
            country='Colombia',
            capacity=100,
        )
        with self.assertRaises(ValidationError):
            obj.full_clean()

    def test_city_required(self):
        """city no puede estar vacio."""
        obj = Warehouse(
            name='Almacen Test',
            address='Calle 1',
            city='',
            country='Colombia',
            capacity=100,
        )
        with self.assertRaises(ValidationError):
            obj.full_clean()

    def test_country_required(self):
        """country no puede estar vacio."""
        obj = Warehouse(
            name='Almacen Test',
            address='Calle 1',
            city='Bogota',
            country='',
            capacity=100,
        )
        with self.assertRaises(ValidationError):
            obj.full_clean()

    def test_ordering_by_name(self):
        """Los almacenes deben ordenarse por nombre por defecto."""
        Warehouse.objects.create(
            name='Almacen Z',
            address='Dir Z',
            city='Ciudad Z',
            country='Colombia',
            capacity=100,
        )
        Warehouse.objects.create(
            name='Almacen A',
            address='Dir A',
            city='Ciudad A',
            country='Colombia',
            capacity=100,
        )
        nombres = list(Warehouse.objects.values_list('name', flat=True))
        self.assertEqual(nombres, sorted(nombres))


class WarehouseStockModelTest(TestCase):
    """Tests del modelo WarehouseStock."""

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacen Stock Test',
            address='Av. Siempreviva 742',
            city='Springfield',
            country='Colombia',
            capacity=5000,
        )
        self.product = Product.objects.create(
            name='Laptop Pro',
            sku='LAP-001',
            category='laptop',
            unit_price='2500.00',
            weight_kg='1.800',
        )
        self.stock = WarehouseStock.objects.create(
            warehouse=self.warehouse,
            product=self.product,
            quantity=50,
        )

    # --- Happy path ---

    def test_create_stock_success(self):
        """Crear un registro de stock con datos validos."""
        self.assertIsNotNone(self.stock.id)
        self.assertEqual(self.stock.warehouse, self.warehouse)
        self.assertEqual(self.stock.product, self.product)
        self.assertEqual(self.stock.quantity, 50)

    def test_quantity_defaults_to_zero(self):
        """quantity tiene DEFAULT 0 — se puede crear sin especificarlo."""
        product2 = Product.objects.create(
            name='Tablet Mini',
            sku='TAB-001',
            category='tablet',
            unit_price='800.00',
            weight_kg='0.500',
        )
        stock = WarehouseStock.objects.create(
            warehouse=self.warehouse,
            product=product2,
        )
        self.assertEqual(stock.quantity, 0)

    def test_auto_timestamp_updated_at(self):
        """updated_at se asigna automaticamente."""
        self.assertIsNotNone(self.stock.updated_at)

    def test_str_representation(self):
        """__str__ incluye warehouse, product y quantity."""
        expected = f'{self.warehouse} — {self.product} ({self.stock.quantity})'
        self.assertEqual(str(self.stock), expected)

    def test_fk_to_warehouse(self):
        """FK warehouse_id apunta correctamente al almacen."""
        self.assertEqual(self.stock.warehouse_id, self.warehouse.id)

    def test_fk_to_product(self):
        """FK product_id apunta correctamente al producto."""
        self.assertEqual(self.stock.product_id, self.product.id)

    # --- Edge case: unique_together ---

    def test_unique_together_warehouse_product(self):
        """No se puede tener dos registros del mismo producto en el mismo almacen."""
        with self.assertRaises(IntegrityError):
            WarehouseStock.objects.create(
                warehouse=self.warehouse,
                product=self.product,
                quantity=10,
            )

    def test_same_product_different_warehouses_allowed(self):
        """El mismo producto puede estar en distintos almacenes."""
        warehouse2 = Warehouse.objects.create(
            name='Almacen Sur',
            address='Calle Sur 100',
            city='Cali',
            country='Colombia',
            capacity=2000,
        )
        stock2 = WarehouseStock.objects.create(
            warehouse=warehouse2,
            product=self.product,
            quantity=20,
        )
        self.assertIsNotNone(stock2.id)
        self.assertEqual(stock2.warehouse, warehouse2)

    def test_same_warehouse_different_products_allowed(self):
        """El mismo almacen puede tener distintos productos."""
        product2 = Product.objects.create(
            name='Monitor 27',
            sku='MON-001',
            category='monitor',
            unit_price='450.00',
            weight_kg='5.200',
        )
        stock2 = WarehouseStock.objects.create(
            warehouse=self.warehouse,
            product=product2,
            quantity=15,
        )
        self.assertIsNotNone(stock2.id)

    # --- Unhappy path: cascade delete ---

    def test_stock_deleted_when_warehouse_deleted(self):
        """Al eliminar el almacen, su stock se elimina en cascada."""
        stock_id = self.stock.id
        self.warehouse.delete()
        self.assertFalse(WarehouseStock.objects.filter(id=stock_id).exists())

    def test_stock_deleted_when_product_deleted(self):
        """Al eliminar el producto, su stock se elimina en cascada."""
        stock_id = self.stock.id
        self.product.delete()
        self.assertFalse(WarehouseStock.objects.filter(id=stock_id).exists())
