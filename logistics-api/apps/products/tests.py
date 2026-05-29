from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse
from .models import Product
from .services import update_stock


class TestUpdateStock(TestCase):

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='TechParts S.A.C.',
            tax_id='20123456789',
            contact_name='Juan Perez',
            email='contacto@techparts.com',
            phone='999000001',
            address='Av. Industrial 123',
            city='Lima',
            country='Peru',
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Central Lima',
            code='ACL-001',
            address='Av. Logistica 456',
            city='Lima',
            state='Lima',
            country='Peru',
            capacity_m3='500.00',
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Laptop Dell XPS 15',
            sku='DELL-XPS15-001',
            unit_price='2500.00',
            weight_kg='2.100',
            stock=10,
        )

    def test_incr_aumenta_stock(self):
        """INCR con quantity=10 sobre un producto con stock=5 resulta en stock=15."""
        self.product.stock = 5
        self.product.save()
        update_stock(self.product, 10, 'INCR')
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 15)

    def test_decr_reduce_stock(self):
        """DECR con quantity=3 sobre un producto con stock=10 resulta en stock=7."""
        self.product.stock = 10
        self.product.save()
        update_stock(self.product, 3, 'DECR')
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 7)

    def test_decr_a_cero(self):
        """DECR con quantity=5 sobre un producto con stock=5 resulta en stock=0 (limite valido)."""
        self.product.stock = 5
        self.product.save()
        update_stock(self.product, 5, 'DECR')
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 0)

    def test_decr_stock_negativo_lanza_error(self):
        """DECR con quantity=10 sobre un producto con stock=5 lanza ValidationError."""
        self.product.stock = 5
        self.product.save()
        with self.assertRaises(ValidationError):
            update_stock(self.product, 10, 'DECR')

    def test_operacion_invalida_lanza_error(self):
        """Pasar operation='INVALID' lanza ValidationError."""
        with self.assertRaises(ValidationError):
            update_stock(self.product, 5, 'INVALID')
