"""
Tests de filtros, búsqueda y ordenamiento del CustomerViewSet.

filterset_fields = ['customer_type', 'city', 'country', 'is_active']
search_fields    = ['name', 'email', 'tax_id']
ordering_fields  = ['name', 'customer_type', 'created_at']
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.customers.models import Customer, CustomerType

URL_LIST = '/api/v1/customers/'


class CustomerFilterTest(APITestCase):
    """Tests de filtros exactos por filterset_fields."""

    def setUp(self):
        self.user = User.objects.create_user(username='filteruser', password='testpass123')
        self.client.force_authenticate(user=self.user)

        self.company = Customer.objects.create(
            name='Empresa Filtros',
            customer_type=CustomerType.COMPANY,
            email='empresa@filtro.com',
            city='Bogotá',
            country='Colombia',
            is_active=True,
        )
        self.individual = Customer.objects.create(
            name='Persona Filtros',
            customer_type=CustomerType.INDIVIDUAL,
            email='persona@filtro.com',
            city='Medellín',
            country='Colombia',
            is_active=False,
        )
        self.peru_customer = Customer.objects.create(
            name='Cliente Perú',
            customer_type=CustomerType.COMPANY,
            email='peru@cliente.com',
            city='Lima',
            country='Perú',
            is_active=True,
        )

    # --- Happy path: filtro por customer_type ---
    def test_filter_by_customer_type_company(self):
        """Filtrar por customer_type=company debe retornar solo empresas."""
        response = self.client.get(URL_LIST, {'customer_type': 'company'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for c in results:
            self.assertEqual(c['customer_type'], 'company')

    def test_filter_by_customer_type_individual(self):
        """Filtrar por customer_type=individual debe retornar solo individuos."""
        response = self.client.get(URL_LIST, {'customer_type': 'individual'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['customer_type'], 'individual')

    # --- Happy path: filtro por city ---
    def test_filter_by_city(self):
        """Filtrar por city=Bogotá debe retornar solo clientes de esa ciudad."""
        response = self.client.get(URL_LIST, {'city': 'Bogotá'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for c in results:
            self.assertEqual(c['city'], 'Bogotá')

    def test_filter_by_city_no_results(self):
        """Filtrar por ciudad sin coincidencias debe retornar lista vacía."""
        response = self.client.get(URL_LIST, {'city': 'CiudadInexistente'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    # --- Happy path: filtro por country ---
    def test_filter_by_country_colombia(self):
        """Filtrar por country=Colombia debe retornar los dos clientes colombianos."""
        response = self.client.get(URL_LIST, {'country': 'Colombia'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for c in results:
            self.assertEqual(c['country'], 'Colombia')

    def test_filter_by_country_peru(self):
        """Filtrar por country=Perú debe retornar solo el cliente peruano."""
        response = self.client.get(URL_LIST, {'country': 'Perú'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['country'], 'Perú')

    # --- Happy path: filtro por is_active ---
    def test_filter_by_is_active_true(self):
        """Filtrar por is_active=true debe retornar solo clientes activos."""
        response = self.client.get(URL_LIST, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for c in results:
            self.assertTrue(c['is_active'])

    def test_filter_by_is_active_false(self):
        """Filtrar por is_active=false debe retornar solo clientes inactivos."""
        response = self.client.get(URL_LIST, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertFalse(results[0]['is_active'])

    # --- Edge case: filtros combinados ---
    def test_filter_combined_country_and_is_active(self):
        """Combinar country=Colombia e is_active=true debe retornar solo la empresa activa."""
        response = self.client.get(URL_LIST, {'country': 'Colombia', 'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Empresa Filtros')

    def test_filter_combined_customer_type_and_city(self):
        """Combinar customer_type=company y city=Lima debe retornar solo el cliente peruano."""
        response = self.client.get(URL_LIST, {'customer_type': 'company', 'city': 'Lima'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Cliente Perú')

    # --- Unhappy path: sin autenticación ---
    def test_filter_unauthenticated_returns_401(self):
        """Filtrar sin autenticación debe retornar 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(URL_LIST, {'city': 'Bogotá'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CustomerSearchTest(APITestCase):
    """Tests de búsqueda de texto libre por search_fields."""

    def setUp(self):
        self.user = User.objects.create_user(username='searchuser', password='testpass123')
        self.client.force_authenticate(user=self.user)

        self.customer_a = Customer.objects.create(
            name='Acme Corporation',
            customer_type=CustomerType.COMPANY,
            email='info@acme.com',
            city='Bogotá',
            country='Colombia',
            tax_id='NIT-ACME',
        )
        self.customer_b = Customer.objects.create(
            name='Beta Solutions',
            customer_type=CustomerType.INDIVIDUAL,
            email='contact@beta.com',
            city='Lima',
            country='Perú',
            tax_id='RUC-BETA',
        )

    # --- Happy path: búsqueda por name ---
    def test_search_by_name_partial_match(self):
        """Búsqueda por fragmento del nombre debe retornar coincidencias."""
        response = self.client.get(URL_LIST, {'search': 'Acme'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Acme Corporation')

    def test_search_by_name_case_insensitive(self):
        """La búsqueda por nombre debe ser insensible a mayúsculas."""
        response = self.client.get(URL_LIST, {'search': 'acme'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)

    # --- Happy path: búsqueda por email ---
    def test_search_by_email(self):
        """Búsqueda por fragmento del email debe retornar coincidencias."""
        response = self.client.get(URL_LIST, {'search': 'beta.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'contact@beta.com')

    # --- Happy path: búsqueda por tax_id ---
    def test_search_by_tax_id(self):
        """Búsqueda por tax_id debe retornar el cliente correcto."""
        response = self.client.get(URL_LIST, {'search': 'NIT-ACME'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['tax_id'], 'NIT-ACME')

    # --- Edge case: búsqueda sin resultados ---
    def test_search_no_match_returns_empty(self):
        """Búsqueda sin coincidencias debe retornar lista vacía."""
        response = self.client.get(URL_LIST, {'search': 'TerminoQueNoExiste'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    # --- Edge case: búsqueda con múltiples resultados ---
    def test_search_matches_multiple_customers(self):
        """Búsqueda que coincide en varios clientes debe retornar todos."""
        response = self.client.get(URL_LIST, {'search': 'info'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 'info' aparece en 'info@acme.com'
        results = response.data['results']
        self.assertGreaterEqual(len(results), 1)


class CustomerOrderingTest(APITestCase):
    """Tests de ordenamiento por ordering_fields."""

    def setUp(self):
        self.user = User.objects.create_user(username='orderuser', password='testpass123')
        self.client.force_authenticate(user=self.user)

        self.customer_z = Customer.objects.create(
            name='Zeta Corp',
            customer_type=CustomerType.COMPANY,
            email='zeta@corp.com',
            city='Bogotá',
            country='Colombia',
        )
        self.customer_a = Customer.objects.create(
            name='Alpha Corp',
            customer_type=CustomerType.INDIVIDUAL,
            email='alpha@corp.com',
            city='Lima',
            country='Perú',
        )
        self.customer_m = Customer.objects.create(
            name='Mega Corp',
            customer_type=CustomerType.COMPANY,
            email='mega@corp.com',
            city='Quito',
            country='Ecuador',
        )

    # --- Happy path: ordenamiento por name ---
    def test_ordering_by_name_ascending(self):
        """Ordenar por name ascendente debe retornar en orden A-Z."""
        response = self.client.get(URL_LIST, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [c['name'] for c in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_descending(self):
        """Ordenar por name descendente debe retornar en orden Z-A."""
        response = self.client.get(URL_LIST, {'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [c['name'] for c in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    # --- Happy path: ordenamiento por customer_type ---
    def test_ordering_by_customer_type_ascending(self):
        """Ordenar por customer_type ascendente debe ser consistente."""
        response = self.client.get(URL_LIST, {'ordering': 'customer_type'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        types = [c['customer_type'] for c in response.data['results']]
        self.assertEqual(types, sorted(types))

    def test_ordering_by_customer_type_descending(self):
        """Ordenar por customer_type descendente debe ser consistente."""
        response = self.client.get(URL_LIST, {'ordering': '-customer_type'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        types = [c['customer_type'] for c in response.data['results']]
        self.assertEqual(types, sorted(types, reverse=True))

    # --- Happy path: ordenamiento por created_at ---
    def test_ordering_by_created_at_ascending(self):
        """Ordenar por created_at ascendente debe retornar del más antiguo al más nuevo."""
        response = self.client.get(URL_LIST, {'ordering': 'created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [c['created_at'] for c in response.data['results']]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_by_created_at_descending(self):
        """Ordenar por created_at descendente debe retornar del más nuevo al más antiguo."""
        response = self.client.get(URL_LIST, {'ordering': '-created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [c['created_at'] for c in response.data['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))

    # --- Edge case: ordenamiento no permitido ignora la clave ---
    def test_ordering_by_invalid_field_returns_200(self):
        """Ordenar por campo no en ordering_fields debe retornar 200 (se ignora)."""
        response = self.client.get(URL_LIST, {'ordering': 'phone'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # --- Edge case: combinar filtro y ordenamiento ---
    def test_filter_combined_with_ordering(self):
        """Filtrar por country y ordenar por name debe funcionar juntos."""
        response = self.client.get(URL_LIST, {'country': 'Colombia', 'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        for c in results:
            self.assertEqual(c['country'], 'Colombia')
        names = [c['name'] for c in results]
        self.assertEqual(names, sorted(names, reverse=True))
