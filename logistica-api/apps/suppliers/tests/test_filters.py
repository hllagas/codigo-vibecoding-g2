from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.suppliers.models import Supplier


class SupplierFilterTest(APITestCase):
    """Tests de filtros, búsqueda y ordenamiento del ViewSet de Supplier."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='filteruser',
            password='filterpass123',
        )
        self.client.force_authenticate(user=self.user)

        self.supplier_co = Supplier.objects.create(
            name='Andina Supplies',
            tax_id='NIT-COL-001',
            email='andina@colombia.com',
            city='Bogota',
            country='Colombia',
            is_active=True,
        )
        self.supplier_pe = Supplier.objects.create(
            name='Pacifico Tech',
            tax_id='RUC-PER-001',
            email='pacifico@peru.com',
            city='Lima',
            country='Peru',
            is_active=True,
        )
        self.supplier_inactive = Supplier.objects.create(
            name='Inactivo Corp',
            tax_id='NIT-INA-001',
            email='inactive@example.com',
            city='Bogota',
            country='Colombia',
            is_active=False,
        )
        self.url_list = '/api/v1/suppliers/'

    # ------------------------------------------------------------------ #
    # filterset_fields — filtro exacto por city                            #
    # ------------------------------------------------------------------ #

    def test_filter_by_city_returns_only_matching(self):
        """?city=Bogota debe retornar solo proveedores de Bogota."""
        response = self.client.get(self.url_list, {'city': 'Bogota'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for supplier in results:
            self.assertEqual(supplier['city'], 'Bogota')

    def test_filter_by_city_excludes_other_cities(self):
        """?city=Lima no debe incluir proveedores de Bogota."""
        response = self.client.get(self.url_list, {'city': 'Lima'})
        names = [s['name'] for s in response.data['results']]
        self.assertNotIn('Andina Supplies', names)
        self.assertIn('Pacifico Tech', names)

    def test_filter_by_city_no_match_returns_empty(self):
        """?city=Tokio (sin coincidencias) debe retornar lista vacía."""
        response = self.client.get(self.url_list, {'city': 'Tokio'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    # ------------------------------------------------------------------ #
    # filterset_fields — filtro exacto por country                         #
    # ------------------------------------------------------------------ #

    def test_filter_by_country_returns_only_matching(self):
        """?country=Peru debe retornar solo proveedores de Peru."""
        response = self.client.get(self.url_list, {'country': 'Peru'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for supplier in results:
            self.assertEqual(supplier['country'], 'Peru')

    # ------------------------------------------------------------------ #
    # filterset_fields — filtro por is_active                              #
    # ------------------------------------------------------------------ #

    def test_filter_is_active_true_returns_active_only(self):
        """?is_active=true debe retornar solo proveedores activos."""
        response = self.client.get(self.url_list, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for supplier in results:
            self.assertTrue(supplier['is_active'])

    def test_filter_is_active_false_returns_inactive_only(self):
        """?is_active=false debe retornar solo proveedores inactivos."""
        response = self.client.get(self.url_list, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for supplier in results:
            self.assertFalse(supplier['is_active'])
        names = [s['name'] for s in results]
        self.assertIn('Inactivo Corp', names)

    # ------------------------------------------------------------------ #
    # search_fields — búsqueda de texto libre                              #
    # ------------------------------------------------------------------ #

    def test_search_by_name_partial_match(self):
        """?search=Andina debe encontrar 'Andina Supplies'."""
        response = self.client.get(self.url_list, {'search': 'Andina'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [s['name'] for s in response.data['results']]
        self.assertIn('Andina Supplies', names)

    def test_search_by_email_partial_match(self):
        """?search=pacifico debe encontrar por email 'pacifico@peru.com'."""
        response = self.client.get(self.url_list, {'search': 'pacifico'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [s['name'] for s in response.data['results']]
        self.assertIn('Pacifico Tech', names)

    def test_search_by_tax_id(self):
        """?search=NIT-COL-001 debe encontrar al proveedor por su tax_id."""
        response = self.client.get(self.url_list, {'search': 'NIT-COL-001'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [s['name'] for s in response.data['results']]
        self.assertIn('Andina Supplies', names)

    def test_search_no_match_returns_empty(self):
        """?search=XXXXXX (sin coincidencias) debe retornar lista vacía."""
        response = self.client.get(self.url_list, {'search': 'XXXXXX'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    # ------------------------------------------------------------------ #
    # ordering_fields — ordenamiento                                       #
    # ------------------------------------------------------------------ #

    def test_ordering_by_name_ascending(self):
        """?ordering=name debe retornar proveedores ordenados A→Z por nombre."""
        response = self.client.get(self.url_list, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [s['name'] for s in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_descending(self):
        """?ordering=-name debe retornar proveedores ordenados Z→A por nombre."""
        response = self.client.get(self.url_list, {'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [s['name'] for s in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_created_at_ascending(self):
        """?ordering=created_at debe retornar proveedores del más antiguo al más reciente."""
        response = self.client.get(self.url_list, {'ordering': 'created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [s['created_at'] for s in response.data['results']]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_by_created_at_descending(self):
        """?ordering=-created_at debe retornar proveedores del más reciente al más antiguo."""
        response = self.client.get(self.url_list, {'ordering': '-created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [s['created_at'] for s in response.data['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))

    # ------------------------------------------------------------------ #
    # Filtros combinados                                                   #
    # ------------------------------------------------------------------ #

    def test_filter_by_country_and_is_active(self):
        """?country=Colombia&is_active=true debe retornar solo activos de Colombia."""
        response = self.client.get(
            self.url_list,
            {'country': 'Colombia', 'is_active': 'true'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for supplier in results:
            self.assertEqual(supplier['country'], 'Colombia')
            self.assertTrue(supplier['is_active'])
        # 'Inactivo Corp' (Colombia, is_active=False) no debe aparecer
        names = [s['name'] for s in results]
        self.assertNotIn('Inactivo Corp', names)
