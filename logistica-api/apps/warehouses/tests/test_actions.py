from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.warehouses.models import Warehouse, WarehouseStock
from apps.products.models import Product


class WarehouseStockActionTest(APITestCase):
    """Tests de la accion custom GET /api/v1/warehouses/{id}/stock/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='stockuser',
            password='stockpass123',
        )
        self.client.force_authenticate(user=self.user)

        self.warehouse = Warehouse.objects.create(
            name='Almacen con Stock',
            address='Calle del Stock 1',
            city='Bogota',
            country='Colombia',
            capacity=5000,
        )

        self.empty_warehouse = Warehouse.objects.create(
            name='Almacen Vacio',
            address='Calle Vacia 2',
            city='Cali',
            country='Colombia',
            capacity=1000,
        )

        self.product1 = Product.objects.create(
            name='Laptop Gamer',
            sku='LAP-G-001',
            category='laptop',
            unit_price='3500.00',
            weight_kg='2.200',
        )

        self.product2 = Product.objects.create(
            name='Mouse Ergonomico',
            sku='MOU-E-001',
            category='periferico',
            unit_price='75.00',
            weight_kg='0.120',
        )

        # Crear stock para warehouse con items
        self.stock1 = WarehouseStock.objects.create(
            warehouse=self.warehouse,
            product=self.product1,
            quantity=30,
        )
        self.stock2 = WarehouseStock.objects.create(
            warehouse=self.warehouse,
            product=self.product2,
            quantity=150,
        )

        self.url_stock = f'/api/v1/warehouses/{self.warehouse.id}/stock/'
        self.url_stock_empty = f'/api/v1/warehouses/{self.empty_warehouse.id}/stock/'

    # --- Happy path ---

    def test_get_stock_with_items_returns_200(self):
        """GET stock de almacen con items retorna 200."""
        response = self.client.get(self.url_stock)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_stock_returns_list(self):
        """GET stock retorna una lista (no un dict paginado)."""
        response = self.client.get(self.url_stock)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_get_stock_returns_correct_count(self):
        """GET stock retorna tantos items como registros de stock existen."""
        response = self.client.get(self.url_stock)
        self.assertEqual(len(response.data), 2)

    def test_get_stock_includes_warehouse_id(self):
        """Cada item de stock incluye el campo warehouse."""
        response = self.client.get(self.url_stock)
        for item in response.data:
            self.assertIn('warehouse', item)
            self.assertEqual(item['warehouse'], self.warehouse.id)

    def test_get_stock_includes_product_id(self):
        """Cada item de stock incluye el campo product con el id del producto."""
        response = self.client.get(self.url_stock)
        product_ids = [item['product'] for item in response.data]
        self.assertIn(self.product1.id, product_ids)
        self.assertIn(self.product2.id, product_ids)

    def test_get_stock_includes_quantity(self):
        """Cada item de stock incluye el campo quantity con la cantidad correcta."""
        response = self.client.get(self.url_stock)
        quantities = {item['product']: item['quantity'] for item in response.data}
        self.assertEqual(quantities[self.product1.id], 30)
        self.assertEqual(quantities[self.product2.id], 150)

    def test_get_stock_includes_updated_at(self):
        """Cada item de stock incluye el campo updated_at."""
        response = self.client.get(self.url_stock)
        for item in response.data:
            self.assertIn('updated_at', item)
            self.assertIsNotNone(item['updated_at'])

    def test_get_stock_includes_id_field(self):
        """Cada item de stock incluye su propio id."""
        response = self.client.get(self.url_stock)
        for item in response.data:
            self.assertIn('id', item)

    # --- Unhappy path ---

    def test_get_stock_warehouse_not_found_returns_404(self):
        """GET stock de almacen inexistente retorna 404."""
        response = self.client.get('/api/v1/warehouses/99999/stock/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_stock_unauthenticated_returns_401(self):
        """GET stock sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_stock)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_stock_unauthenticated_empty_warehouse_returns_401(self):
        """GET stock de almacen vacio sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_stock_empty)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_get_stock_empty_warehouse_returns_200(self):
        """GET stock de almacen sin items retorna 200 con lista vacia."""
        response = self.client.get(self.url_stock_empty)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_stock_empty_warehouse_returns_empty_list(self):
        """GET stock de almacen vacio retorna lista de longitud cero."""
        response = self.client.get(self.url_stock_empty)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 0)

    def test_get_stock_only_returns_stock_for_given_warehouse(self):
        """El endpoint retorna solo el stock del almacen solicitado, no de otros."""
        # Agregar stock al almacen vacio
        WarehouseStock.objects.create(
            warehouse=self.empty_warehouse,
            product=self.product1,
            quantity=5,
        )
        response = self.client.get(self.url_stock)
        # El almacen base sigue teniendo solo 2 items
        self.assertEqual(len(response.data), 2)
        warehouses_in_response = {item['warehouse'] for item in response.data}
        self.assertEqual(warehouses_in_response, {self.warehouse.id})

    def test_get_stock_quantity_zero_is_included(self):
        """Stock con quantity=0 debe aparecer en la respuesta."""
        product3 = Product.objects.create(
            name='Teclado Sin Stock',
            sku='TEC-000',
            category='periferico',
            unit_price='50.00',
            weight_kg='0.800',
        )
        WarehouseStock.objects.create(
            warehouse=self.warehouse,
            product=product3,
            quantity=0,
        )
        response = self.client.get(self.url_stock)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Ahora el almacen tiene 3 items, incluyendo el de quantity=0
        self.assertEqual(len(response.data), 3)
        quantities = [item['quantity'] for item in response.data]
        self.assertIn(0, quantities)

    def test_stock_action_only_accepts_get(self):
        """La accion stock no acepta POST — el router no registra ese metodo."""
        response = self.client.post(self.url_stock, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
