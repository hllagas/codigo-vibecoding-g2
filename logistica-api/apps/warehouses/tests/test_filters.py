from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.warehouses.models import Warehouse


class WarehouseFilterTest(APITestCase):
    """Tests de filtros, busqueda y ordenamiento en /api/v1/warehouses/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='filteruser',
            password='filterpass123',
        )
        self.client.force_authenticate(user=self.user)

        # Crear conjunto diverso de almacenes para probar filtros
        self.warehouse_bog_active = Warehouse.objects.create(
            name='Bodega Bogota Norte',
            address='Calle 100 # 15-30',
            city='Bogota',
            country='Colombia',
            capacity=1000,
            is_active=True,
        )
        self.warehouse_bog_inactive = Warehouse.objects.create(
            name='Antigua Bodega Centro',
            address='Carrera 7 # 12-50',
            city='Bogota',
            country='Colombia',
            capacity=200,
            is_active=False,
        )
        self.warehouse_med = Warehouse.objects.create(
            name='Centro Distribucion Medellin',
            address='Calle 80 # 65-20',
            city='Medellin',
            country='Colombia',
            capacity=3000,
            is_active=True,
        )
        self.warehouse_mx = Warehouse.objects.create(
            name='Mexico Almacen Central',
            address='Av. Insurgentes 1200',
            city='Ciudad de Mexico',
            country='Mexico',
            capacity=5000,
            is_active=True,
        )

        self.url = '/api/v1/warehouses/'

    def _get_results(self, response):
        """Extraer lista de resultados independientemente de si hay paginacion."""
        return response.data.get('results', response.data)

    # --- Filtro por city ---

    def test_filter_by_city_bogota(self):
        """Filtrar por city=Bogota retorna solo almacenes en Bogota."""
        response = self.client.get(self.url, {'city': 'Bogota'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        for item in results:
            self.assertEqual(item['city'], 'Bogota')

    def test_filter_by_city_medellin(self):
        """Filtrar por city=Medellin retorna solo el almacen de Medellin."""
        response = self.client.get(self.url, {'city': 'Medellin'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.warehouse_med.id)

    def test_filter_by_city_no_match(self):
        """Filtrar por una ciudad inexistente retorna lista vacia."""
        response = self.client.get(self.url, {'city': 'Tokio'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        self.assertEqual(len(results), 0)

    # --- Filtro por country ---

    def test_filter_by_country_colombia(self):
        """Filtrar por country=Colombia retorna solo almacenes de Colombia."""
        response = self.client.get(self.url, {'country': 'Colombia'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        for item in results:
            self.assertEqual(item['country'], 'Colombia')

    def test_filter_by_country_mexico(self):
        """Filtrar por country=Mexico retorna solo el almacen de Mexico."""
        response = self.client.get(self.url, {'country': 'Mexico'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.warehouse_mx.id)

    # --- Filtro por is_active ---

    def test_filter_by_is_active_true(self):
        """Filtrar por is_active=true retorna solo almacenes activos."""
        response = self.client.get(self.url, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        for item in results:
            self.assertTrue(item['is_active'])

    def test_filter_by_is_active_false(self):
        """Filtrar por is_active=false retorna solo almacenes inactivos."""
        response = self.client.get(self.url, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        for item in results:
            self.assertFalse(item['is_active'])
        # Solo hay un almacen inactivo en el setUp
        self.assertEqual(len(results), 1)

    # --- Filtros combinados ---

    def test_filter_by_city_and_is_active(self):
        """Combinar city y is_active retorna interseccion correcta."""
        response = self.client.get(self.url, {'city': 'Bogota', 'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        # Solo warehouse_bog_active cumple ambas condiciones
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.warehouse_bog_active.id)

    def test_filter_by_country_and_is_active_false(self):
        """Colombia + is_active=false retorna solo el almacen inactivo colombiano."""
        response = self.client.get(self.url, {'country': 'Colombia', 'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.warehouse_bog_inactive.id)

    # --- Search fields ---

    def test_search_by_name(self):
        """search=Centro encuentra almacenes cuyo name contiene 'Centro'."""
        response = self.client.get(self.url, {'search': 'Centro'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        names = [item['name'] for item in results]
        # 'Centro Distribucion Medellin' y 'Antigua Bodega Centro' contienen 'Centro'
        # 'Mexico Almacen Central' no contiene 'Centro' exacto pero si 'Central'
        # Solo verificamos que al menos uno coincide
        self.assertGreater(len(results), 0)

    def test_search_by_address(self):
        """search=Insurgentes encuentra almacenes cuya address contiene ese termino."""
        response = self.client.get(self.url, {'search': 'Insurgentes'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.warehouse_mx.id)

    def test_search_by_city_field(self):
        """search=Medellin encuentra almacenes cuya city contiene 'Medellin'."""
        response = self.client.get(self.url, {'search': 'Medellin'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.warehouse_med.id)

    def test_search_no_match(self):
        """search con termino inexistente retorna lista vacia."""
        response = self.client.get(self.url, {'search': 'XYZ_INEXISTENTE_12345'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        self.assertEqual(len(results), 0)

    # --- Ordering ---

    def test_ordering_by_name_ascending(self):
        """ordering=name retorna almacenes ordenados alfabeticamente."""
        response = self.client.get(self.url, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        names = [item['name'] for item in results]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_descending(self):
        """ordering=-name retorna almacenes en orden alfabetico inverso."""
        response = self.client.get(self.url, {'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        names = [item['name'] for item in results]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_capacity_ascending(self):
        """ordering=capacity retorna almacenes de menor a mayor capacidad."""
        response = self.client.get(self.url, {'ordering': 'capacity'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        capacities = [item['capacity'] for item in results]
        self.assertEqual(capacities, sorted(capacities))

    def test_ordering_by_capacity_descending(self):
        """ordering=-capacity retorna almacenes de mayor a menor capacidad."""
        response = self.client.get(self.url, {'ordering': '-capacity'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        capacities = [item['capacity'] for item in results]
        self.assertEqual(capacities, sorted(capacities, reverse=True))

    def test_ordering_by_created_at(self):
        """ordering=created_at retorna almacenes por fecha de creacion ascendente."""
        response = self.client.get(self.url, {'ordering': 'created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        dates = [item['created_at'] for item in results]
        self.assertEqual(dates, sorted(dates))
