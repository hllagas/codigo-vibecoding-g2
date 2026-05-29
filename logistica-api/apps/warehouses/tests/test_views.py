from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.warehouses.models import Warehouse


class WarehouseViewSetTest(APITestCase):
    """Tests de endpoints CRUD /api/v1/warehouses/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        self.client.force_authenticate(user=self.user)

        self.warehouse = Warehouse.objects.create(
            name='Almacen Base',
            address='Carrera 15 # 93-75',
            city='Bogota',
            country='Colombia',
            capacity=1000,
        )

        self.valid_payload = {
            'name': 'Almacen Nuevo',
            'address': 'Avenida El Dorado 68C-61',
            'city': 'Bogota',
            'country': 'Colombia',
            'capacity': 500,
        }

        self.invalid_payload = {
            'name': '',
            'address': '',
            'city': '',
            'country': '',
            'capacity': '',
        }

        self.url_list = '/api/v1/warehouses/'
        self.url_detail = f'/api/v1/warehouses/{self.warehouse.id}/'

    # --- Happy path ---

    def test_list_warehouses(self):
        """GET /warehouses/ retorna 200 con lista paginada."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_warehouses_contains_created_instance(self):
        """La lista incluye el almacen creado en setUp."""
        response = self.client.get(self.url_list)
        results = response.data.get('results', response.data)
        ids = [item['id'] for item in results]
        self.assertIn(self.warehouse.id, ids)

    def test_create_warehouse_success(self):
        """POST con payload valido retorna 201 y crea el almacen."""
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], self.valid_payload['name'])
        self.assertEqual(response.data['city'], self.valid_payload['city'])

    def test_create_warehouse_returns_all_fields(self):
        """La respuesta 201 incluye id, created_at y updated_at."""
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_retrieve_warehouse(self):
        """GET /warehouses/{id}/ retorna 200 con los datos del almacen."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.warehouse.id)
        self.assertEqual(response.data['name'], self.warehouse.name)

    def test_update_warehouse_put(self):
        """PUT /warehouses/{id}/ actualiza todos los campos y retorna 200."""
        payload = {
            'name': 'Almacen Actualizado',
            'address': 'Nueva Direccion 100',
            'city': 'Medellin',
            'country': 'Colombia',
            'capacity': 2000,
        }
        response = self.client.put(self.url_detail, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Almacen Actualizado')
        self.assertEqual(response.data['city'], 'Medellin')
        self.assertEqual(response.data['capacity'], 2000)

    def test_partial_update_warehouse_patch(self):
        """PATCH /warehouses/{id}/ actualiza parcialmente y retorna 200."""
        response = self.client.patch(self.url_detail, {'capacity': 9999}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['capacity'], 9999)

    def test_delete_warehouse(self):
        """DELETE /warehouses/{id}/ retorna 204 y elimina el registro."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Warehouse.objects.filter(id=self.warehouse.id).exists())

    def test_is_active_defaults_to_true_on_create(self):
        """Al crear sin especificar is_active, el campo debe ser True."""
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_active'])

    def test_create_warehouse_with_optional_coordinates(self):
        """Se puede crear almacen con latitud y longitud."""
        payload = {
            **self.valid_payload,
            'latitude': '4.710989',
            'longitude': '-74.072090',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['latitude'])
        self.assertIsNotNone(response.data['longitude'])

    # --- Unhappy path ---

    def test_create_warehouse_invalid_data(self):
        """POST con campos requeridos vacios retorna 400."""
        response = self.client.post(self.url_list, self.invalid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_warehouse_missing_name(self):
        """POST sin name retorna 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_warehouse_missing_capacity(self):
        """POST sin capacity retorna 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'capacity'}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_warehouse_not_found(self):
        """GET /warehouses/99999/ retorna 404."""
        response = self.client.get('/api/v1/warehouses/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_warehouse_not_found(self):
        """PUT /warehouses/99999/ retorna 404."""
        response = self.client.put('/api/v1/warehouses/99999/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_warehouse_not_found(self):
        """DELETE /warehouses/99999/ retorna 404."""
        response = self.client.delete('/api/v1/warehouses/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_list(self):
        """GET sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create(self):
        """POST sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve(self):
        """GET detalle sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_delete(self):
        """DELETE sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_list_warehouses_empty(self):
        """GET cuando no hay almacenes retorna 200 con lista vacia."""
        Warehouse.objects.all().delete()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_create_warehouse_with_null_coordinates(self):
        """Crear almacen con latitude y longitude null es valido."""
        payload = {
            **self.valid_payload,
            'latitude': None,
            'longitude': None,
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['latitude'])
        self.assertIsNone(response.data['longitude'])

    def test_patch_only_name(self):
        """PATCH con un solo campo no afecta los demas campos."""
        original_city = self.warehouse.city
        response = self.client.patch(self.url_detail, {'name': 'Nombre Parcial'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Nombre Parcial')
        self.assertEqual(response.data['city'], original_city)

    def test_patch_is_active_to_false(self):
        """PATCH puede desactivar un almacen."""
        response = self.client.patch(self.url_detail, {'is_active': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    def test_list_returns_paginated_response(self):
        """La lista retorna estructura paginada con count y results."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
