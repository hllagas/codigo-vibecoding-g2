from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Product
from apps.suppliers.models import Supplier


class ProductFilterTest(APITestCase):
    """Tests de filtros, busqueda y ordenamiento del ViewSet de Product.

    filterset_fields = ['category', 'supplier', 'is_active']
    search_fields    = ['name', 'sku']
    ordering_fields  = ['name', 'unit_price', 'created_at']
    """

    def setUp(self):
        self.user = User.objects.create_user(username='filteruser', password='filterpass123')
        self.client.force_authenticate(user=self.user)

        self.supplier_a = Supplier.objects.create(
            name='Supplier Alpha',
            email='alpha@test.com',
            city='Bogota',
            country='Colombia',
        )
        self.supplier_b = Supplier.objects.create(
            name='Supplier Beta',
            email='beta@test.com',
            city='Madrid',
            country='Spain',
        )

        self.laptop = Product.objects.create(
            name='Laptop Pro',
            sku='LAP-001',
            category='laptop',
            unit_price=Decimal('1500.00'),
            weight_kg=Decimal('2.500'),
            supplier=self.supplier_a,
            is_active=True,
        )
        self.smartphone = Product.objects.create(
            name='Smartphone X',
            sku='SPH-001',
            category='smartphone',
            unit_price=Decimal('999.00'),
            weight_kg=Decimal('0.200'),
            supplier=self.supplier_b,
            is_active=True,
        )
        self.tablet_inactive = Product.objects.create(
            name='Tablet S',
            sku='TAB-001',
            category='tablet',
            unit_price=Decimal('450.00'),
            weight_kg=Decimal('0.800'),
            supplier=self.supplier_a,
            is_active=False,
        )
        self.monitor = Product.objects.create(
            name='Monitor 4K',
            sku='MON-001',
            category='monitor',
            unit_price=Decimal('350.00'),
            weight_kg=Decimal('4.000'),
            supplier=self.supplier_b,
            is_active=True,
        )

        self.url = '/api/v1/products/'

    def _get_skus(self, response):
        """Extrae los SKUs de la respuesta (con o sin paginacion)."""
        results = response.data.get('results', response.data)
        return [p['sku'] for p in results]

    # --- filterset_fields: category ---

    def test_filter_by_category_laptop(self):
        """?category=laptop retorna solo laptops."""
        response = self.client.get(self.url, {'category': 'laptop'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('LAP-001', skus)
        self.assertNotIn('SPH-001', skus)
        self.assertNotIn('TAB-001', skus)

    def test_filter_by_category_smartphone(self):
        """?category=smartphone retorna solo smartphones."""
        response = self.client.get(self.url, {'category': 'smartphone'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('SPH-001', skus)
        self.assertNotIn('LAP-001', skus)

    def test_filter_by_category_inexistente(self):
        """?category=inexistente retorna lista vacia."""
        response = self.client.get(self.url, {'category': 'hologram'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertEqual(len(skus), 0)

    # --- filterset_fields: supplier ---

    def test_filter_by_supplier_a(self):
        """?supplier={id} retorna solo productos de ese proveedor."""
        response = self.client.get(self.url, {'supplier': self.supplier_a.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('LAP-001', skus)
        self.assertIn('TAB-001', skus)
        self.assertNotIn('SPH-001', skus)
        self.assertNotIn('MON-001', skus)

    def test_filter_by_supplier_b(self):
        """?supplier={id} retorna solo productos de supplier_b."""
        response = self.client.get(self.url, {'supplier': self.supplier_b.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('SPH-001', skus)
        self.assertIn('MON-001', skus)
        self.assertNotIn('LAP-001', skus)

    def test_filter_by_supplier_inexistente(self):
        """?supplier=99999 con ID de FK inexistente retorna 400 — django-filter valida la FK."""
        response = self.client.get(self.url, {'supplier': 99999})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- filterset_fields: is_active ---

    def test_filter_by_is_active_true(self):
        """?is_active=true retorna solo productos activos."""
        response = self.client.get(self.url, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('LAP-001', skus)
        self.assertIn('SPH-001', skus)
        self.assertIn('MON-001', skus)
        self.assertNotIn('TAB-001', skus)

    def test_filter_by_is_active_false(self):
        """?is_active=false retorna solo productos inactivos."""
        response = self.client.get(self.url, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('TAB-001', skus)
        self.assertNotIn('LAP-001', skus)

    # --- search_fields: name y sku ---

    def test_search_by_name_partial(self):
        """?search=Laptop retorna productos cuyo nombre contiene 'Laptop'."""
        response = self.client.get(self.url, {'search': 'Laptop'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('LAP-001', skus)
        self.assertNotIn('SPH-001', skus)

    def test_search_by_sku(self):
        """?search=SPH-001 retorna el producto con ese SKU."""
        response = self.client.get(self.url, {'search': 'SPH-001'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('SPH-001', skus)
        self.assertNotIn('LAP-001', skus)

    def test_search_case_insensitive(self):
        """Busqueda es case-insensitive — 'laptop' encuentra 'Laptop Pro'."""
        response = self.client.get(self.url, {'search': 'laptop'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('LAP-001', skus)

    def test_search_no_match_returns_empty(self):
        """?search=XYZ sin coincidencias retorna lista vacia."""
        response = self.client.get(self.url, {'search': 'XYZ_NO_MATCH'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertEqual(len(skus), 0)

    def test_search_by_sku_prefix(self):
        """?search=MON retorna productos cuyo SKU empieza con MON."""
        response = self.client.get(self.url, {'search': 'MON'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('MON-001', skus)

    # --- ordering_fields: name, unit_price, created_at ---

    def test_ordering_by_name_ascending(self):
        """?ordering=name retorna productos ordenados por nombre A-Z."""
        response = self.client.get(self.url, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        names = [p['name'] for p in results]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_descending(self):
        """?ordering=-name retorna productos ordenados por nombre Z-A."""
        response = self.client.get(self.url, {'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        names = [p['name'] for p in results]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_unit_price_ascending(self):
        """?ordering=unit_price retorna productos de menor a mayor precio."""
        response = self.client.get(self.url, {'ordering': 'unit_price'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        prices = [Decimal(p['unit_price']) for p in results]
        self.assertEqual(prices, sorted(prices))

    def test_ordering_by_unit_price_descending(self):
        """?ordering=-unit_price retorna productos de mayor a menor precio."""
        response = self.client.get(self.url, {'ordering': '-unit_price'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        prices = [Decimal(p['unit_price']) for p in results]
        self.assertEqual(prices, sorted(prices, reverse=True))

    def test_ordering_by_created_at_ascending(self):
        """?ordering=created_at retorna productos del mas antiguo al mas nuevo."""
        response = self.client.get(self.url, {'ordering': 'created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        dates = [p['created_at'] for p in results]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_by_created_at_descending(self):
        """?ordering=-created_at retorna productos del mas nuevo al mas antiguo."""
        response = self.client.get(self.url, {'ordering': '-created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        dates = [p['created_at'] for p in results]
        self.assertEqual(dates, sorted(dates, reverse=True))

    # --- Filtros combinados ---

    def test_filter_category_and_is_active(self):
        """?category=laptop&is_active=true retorna solo laptops activos."""
        response = self.client.get(self.url, {'category': 'laptop', 'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('LAP-001', skus)
        self.assertNotIn('TAB-001', skus)

    def test_filter_supplier_and_is_active(self):
        """?supplier={id}&is_active=true retorna solo productos activos de ese proveedor."""
        response = self.client.get(
            self.url,
            {'supplier': self.supplier_a.id, 'is_active': 'true'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        # LAP-001 es activo y de supplier_a; TAB-001 es inactivo
        self.assertIn('LAP-001', skus)
        self.assertNotIn('TAB-001', skus)

    def test_filter_supplier_and_category(self):
        """?supplier={id}&category=monitor retorna monitores de ese proveedor."""
        response = self.client.get(
            self.url,
            {'supplier': self.supplier_b.id, 'category': 'monitor'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = self._get_skus(response)
        self.assertIn('MON-001', skus)
        self.assertNotIn('SPH-001', skus)

    def test_search_with_ordering(self):
        """?search=S&ordering=unit_price retorna smartphones y monitores ordenados por precio."""
        response = self.client.get(self.url, {'search': 'S', 'ordering': 'unit_price'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        prices = [Decimal(p['unit_price']) for p in results]
        self.assertEqual(prices, sorted(prices))
