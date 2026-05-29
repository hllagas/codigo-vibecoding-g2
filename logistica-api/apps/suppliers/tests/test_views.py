from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.suppliers.models import Supplier


class SupplierViewSetTest(APITestCase):
    """Tests de los endpoints CRUD /api/v1/suppliers/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        self.client.force_authenticate(user=self.user)

        self.supplier = Supplier.objects.create(
            name='Tech Corp',
            tax_id='NIT-001',
            email='contact@techcorp.com',
            phone='+573001234567',
            city='Bogota',
            country='Colombia',
        )
        self.valid_payload = {
            'name': 'New Supplier',
            'email': 'new@supplier.com',
            'city': 'Medellin',
            'country': 'Colombia',
        }
        self.invalid_payload = {
            'name': '',
            'email': '',
            'city': '',
            'country': '',
        }
        self.url_list = '/api/v1/suppliers/'
        self.url_detail = f'/api/v1/suppliers/{self.supplier.id}/'

    # ------------------------------------------------------------------ #
    # Happy path — list                                                    #
    # ------------------------------------------------------------------ #

    def test_list_suppliers_returns_200(self):
        """GET /api/v1/suppliers/ debe retornar 200 con resultados paginados."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_suppliers_contains_created_supplier(self):
        """El proveedor creado en setUp debe aparecer en el listado."""
        response = self.client.get(self.url_list)
        names = [s['name'] for s in response.data['results']]
        self.assertIn('Tech Corp', names)

    # ------------------------------------------------------------------ #
    # Happy path — create                                                  #
    # ------------------------------------------------------------------ #

    def test_create_supplier_success(self):
        """POST con datos válidos debe retornar 201 y crear el objeto."""
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Supplier')
        self.assertEqual(response.data['city'], 'Medellin')
        self.assertTrue(Supplier.objects.filter(name='New Supplier').exists())

    def test_create_supplier_returns_id_and_timestamps(self):
        """La respuesta de creación debe incluir id, created_at y updated_at."""
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_create_supplier_is_active_defaults_true(self):
        """Crear proveedor sin is_active → debe venir True en la respuesta."""
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertTrue(response.data['is_active'])

    def test_create_supplier_with_all_optional_fields(self):
        """POST con todos los campos opcionales debe retornar 201."""
        payload = {
            'name': 'Full Supplier',
            'tax_id': 'NIT-FULL',
            'email': 'full@supplier.com',
            'phone': '+571234567',
            'address': 'Av Siempre Viva 123',
            'city': 'Cali',
            'country': 'Colombia',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tax_id'], 'NIT-FULL')
        self.assertEqual(response.data['address'], 'Av Siempre Viva 123')

    # ------------------------------------------------------------------ #
    # Happy path — retrieve                                                #
    # ------------------------------------------------------------------ #

    def test_retrieve_supplier_returns_200(self):
        """GET /api/v1/suppliers/{id}/ debe retornar 200 con los datos del proveedor."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.supplier.id)
        self.assertEqual(response.data['name'], 'Tech Corp')

    # ------------------------------------------------------------------ #
    # Happy path — update (PUT)                                            #
    # ------------------------------------------------------------------ #

    def test_update_supplier_success(self):
        """PUT con datos completos válidos debe retornar 200 y actualizar el objeto."""
        payload = {
            'name': 'Tech Corp Updated',
            'email': 'updated@techcorp.com',
            'city': 'Cali',
            'country': 'Colombia',
        }
        response = self.client.put(self.url_detail, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Tech Corp Updated')
        self.assertEqual(response.data['city'], 'Cali')

    # ------------------------------------------------------------------ #
    # Happy path — partial update (PATCH)                                  #
    # ------------------------------------------------------------------ #

    def test_partial_update_supplier_success(self):
        """PATCH con un solo campo debe retornar 200 y actualizar solo ese campo."""
        response = self.client.patch(self.url_detail, {'city': 'Cartagena'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Cartagena')
        # El nombre no debe haber cambiado
        self.assertEqual(response.data['name'], 'Tech Corp')

    def test_partial_update_deactivate_supplier(self):
        """PATCH con is_active=False debe desactivar el proveedor."""
        response = self.client.patch(self.url_detail, {'is_active': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    # ------------------------------------------------------------------ #
    # Happy path — destroy                                                 #
    # ------------------------------------------------------------------ #

    def test_delete_supplier_returns_204(self):
        """DELETE debe retornar 204 y eliminar el objeto de la BD."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Supplier.objects.filter(id=self.supplier.id).exists())

    # ------------------------------------------------------------------ #
    # Unhappy path — autenticación                                         #
    # ------------------------------------------------------------------ #

    def test_list_unauthenticated_returns_401(self):
        """Request sin token debe retornar 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        """POST sin token debe retornar 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_unauthenticated_returns_401(self):
        """GET detail sin token debe retornar 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------ #
    # Unhappy path — not found                                             #
    # ------------------------------------------------------------------ #

    def test_retrieve_supplier_not_found(self):
        """GET con id inexistente debe retornar 404."""
        response = self.client.get('/api/v1/suppliers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_supplier_not_found(self):
        """PUT con id inexistente debe retornar 404."""
        response = self.client.put(
            '/api/v1/suppliers/99999/',
            self.valid_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_supplier_not_found(self):
        """DELETE con id inexistente debe retornar 404."""
        response = self.client.delete('/api/v1/suppliers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------ #
    # Unhappy path — datos inválidos                                       #
    # ------------------------------------------------------------------ #

    def test_create_supplier_missing_name_returns_400(self):
        """POST sin name debe retornar 400."""
        payload = {
            'email': 'noname@example.com',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_supplier_missing_email_returns_400(self):
        """POST sin email debe retornar 400."""
        payload = {
            'name': 'Sin Email',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_supplier_missing_city_returns_400(self):
        """POST sin city debe retornar 400."""
        payload = {
            'name': 'Sin Ciudad',
            'email': 'sincity@example.com',
            'country': 'Colombia',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('city', response.data)

    def test_create_supplier_missing_country_returns_400(self):
        """POST sin country debe retornar 400."""
        payload = {
            'name': 'Sin Pais',
            'email': 'sinpais@example.com',
            'city': 'Bogota',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('country', response.data)

    def test_create_supplier_invalid_email_returns_400(self):
        """POST con email malformado debe retornar 400."""
        payload = {
            'name': 'Bad Email',
            'email': 'not-an-email',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_supplier_duplicate_tax_id_returns_400(self):
        """POST con tax_id ya existente debe retornar 400."""
        payload = {
            'name': 'Duplicado Corp',
            'tax_id': 'NIT-001',  # mismo que el supplier de setUp
            'email': 'dup@example.com',
            'city': 'Cali',
            'country': 'Colombia',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tax_id', response.data)

    def test_update_supplier_empty_name_returns_400(self):
        """PUT con name vacío debe retornar 400."""
        payload = {
            'name': '',
            'email': 'contact@techcorp.com',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        response = self.client.put(self.url_detail, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # Edge cases — lista vacía                                             #
    # ------------------------------------------------------------------ #

    def test_list_suppliers_empty(self):
        """GET con BD vacía debe retornar 200 y lista results vacía."""
        Supplier.objects.all().delete()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', [])), 0)

    # ------------------------------------------------------------------ #
    # Edge cases — campos nullable en creación                             #
    # ------------------------------------------------------------------ #

    def test_create_supplier_without_optional_fields(self):
        """POST sin tax_id, phone ni address debe retornar 201."""
        payload = {
            'name': 'Minimal Corp',
            'email': 'minimal@example.com',
            'city': 'Lima',
            'country': 'Peru',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data.get('tax_id'))
        self.assertIsNone(response.data.get('phone'))
        self.assertIsNone(response.data.get('address'))

    def test_create_supplier_with_null_tax_id_explicit(self):
        """POST con tax_id=null explícito debe retornar 201."""
        payload = {
            'name': 'Null TaxId Corp',
            'tax_id': None,
            'email': 'nulltax@example.com',
            'city': 'Quito',
            'country': 'Ecuador',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['tax_id'])

    def test_two_suppliers_with_null_tax_id_allowed(self):
        """Dos proveedores con tax_id=null deben crearse sin error (UNIQUE no afecta NULLs)."""
        payload_a = {
            'name': 'Null A',
            'tax_id': None,
            'email': 'nulla@example.com',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        payload_b = {
            'name': 'Null B',
            'tax_id': None,
            'email': 'nullb@example.com',
            'city': 'Lima',
            'country': 'Peru',
        }
        resp_a = self.client.post(self.url_list, payload_a, format='json')
        resp_b = self.client.post(self.url_list, payload_b, format='json')
        self.assertEqual(resp_a.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp_b.status_code, status.HTTP_201_CREATED)

    # ------------------------------------------------------------------ #
    # Edge cases — read_only_fields                                        #
    # ------------------------------------------------------------------ #

    def test_create_supplier_ignores_id_in_payload(self):
        """El campo id es read_only — enviar id en el payload no debe afectar el resultado."""
        payload = {
            'id': 9999,
            'name': 'No Override Id',
            'email': 'noid@example.com',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['id'], 9999)
