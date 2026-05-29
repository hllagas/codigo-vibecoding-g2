"""
Tests de endpoints del ViewSet CustomerViewSet.

Endpoints cubiertos (generados por DefaultRouter):
- GET    /api/v1/customers/         → list
- POST   /api/v1/customers/         → create
- GET    /api/v1/customers/{id}/    → retrieve
- PUT    /api/v1/customers/{id}/    → update
- PATCH  /api/v1/customers/{id}/    → partial_update
- DELETE /api/v1/customers/{id}/    → destroy

Casos cubiertos por endpoint:
- Happy path: operación exitosa con datos válidos
- Unhappy path: datos inválidos (400), id inexistente (404)
- Edge case: sin autenticación (401), lista vacía, campos opcionales
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.customers.models import Customer, CustomerType

URL_LIST = '/api/v1/customers/'


def url_detail(pk):
    return f'/api/v1/customers/{pk}/'


class CustomerListTest(APITestCase):
    """Tests del endpoint GET /api/v1/customers/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            name='Empresa Lista',
            customer_type=CustomerType.COMPANY,
            email='lista@empresa.com',
            city='Bogotá',
            country='Colombia',
        )

    # --- Happy path ---
    def test_list_customers_returns_200(self):
        """GET list con autenticación debe retornar 200."""
        response = self.client.get(URL_LIST)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_customers_returns_paginated_results(self):
        """GET list debe retornar estructura paginada con 'results'."""
        response = self.client.get(URL_LIST)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_list_customers_contains_created_customer(self):
        """GET list debe incluir el cliente creado en setUp."""
        response = self.client.get(URL_LIST)
        ids = [c['id'] for c in response.data['results']]
        self.assertIn(self.customer.id, ids)

    # --- Unhappy path ---
    def test_list_customers_unauthenticated_returns_401(self):
        """GET list sin autenticación debe retornar 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(URL_LIST)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge case ---
    def test_list_customers_empty_returns_200_with_empty_results(self):
        """GET list sin clientes debe retornar 200 con results vacío."""
        Customer.objects.all().delete()
        response = self.client.get(URL_LIST)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', response.data)), 0)


class CustomerCreateTest(APITestCase):
    """Tests del endpoint POST /api/v1/customers/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.valid_payload = {
            'name': 'Nueva Empresa',
            'customer_type': 'company',
            'email': 'nueva@empresa.com',
            'city': 'Bogotá',
            'country': 'Colombia',
        }

    # --- Happy path ---
    def test_create_customer_with_required_fields_returns_201(self):
        """POST con campos obligatorios debe retornar 201 y crear el cliente."""
        response = self.client.post(URL_LIST, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Customer.objects.count(), 1)

    def test_create_customer_response_contains_id(self):
        """POST exitoso debe retornar el id generado."""
        response = self.client.post(URL_LIST, self.valid_payload, format='json')
        self.assertIn('id', response.data)
        self.assertIsNotNone(response.data['id'])

    def test_create_customer_response_contains_timestamps(self):
        """POST exitoso debe retornar created_at y updated_at."""
        response = self.client.post(URL_LIST, self.valid_payload, format='json')
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_create_customer_individual_type(self):
        """POST con customer_type='individual' debe funcionar correctamente."""
        payload = {**self.valid_payload, 'customer_type': 'individual', 'name': 'Persona Natural'}
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['customer_type'], 'individual')

    def test_create_customer_with_all_optional_fields(self):
        """POST con todos los campos (incluidos opcionales) debe retornar 201."""
        payload = {
            **self.valid_payload,
            'tax_id': 'NIT-900888777',
            'phone': '+57 310 000 0000',
            'address': 'Av. Siempre Viva 742',
        }
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tax_id'], 'NIT-900888777')
        self.assertEqual(response.data['phone'], '+57 310 000 0000')
        self.assertEqual(response.data['address'], 'Av. Siempre Viva 742')

    def test_create_customer_is_active_defaults_true(self):
        """POST sin is_active debe crear el cliente con is_active=True."""
        response = self.client.post(URL_LIST, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_active'])

    # --- Unhappy path ---
    def test_create_customer_unauthenticated_returns_401(self):
        """POST sin autenticación debe retornar 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(URL_LIST, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_customer_missing_name_returns_400(self):
        """POST sin name debe retornar 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_customer_missing_customer_type_returns_400(self):
        """POST sin customer_type debe retornar 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'customer_type'}
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer_type', response.data)

    def test_create_customer_missing_email_returns_400(self):
        """POST sin email debe retornar 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'email'}
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_customer_missing_city_returns_400(self):
        """POST sin city debe retornar 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'city'}
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('city', response.data)

    def test_create_customer_missing_country_returns_400(self):
        """POST sin country debe retornar 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'country'}
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('country', response.data)

    def test_create_customer_invalid_email_returns_400(self):
        """POST con email inválido debe retornar 400."""
        payload = {**self.valid_payload, 'email': 'no-es-email'}
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_customer_invalid_customer_type_returns_400(self):
        """POST con customer_type inválido debe retornar 400."""
        payload = {**self.valid_payload, 'customer_type': 'persona'}
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer_type', response.data)

    def test_create_customer_duplicate_tax_id_returns_400(self):
        """POST con tax_id duplicado debe retornar 400."""
        Customer.objects.create(
            name='Primero',
            customer_type=CustomerType.COMPANY,
            email='primero@test.com',
            city='Bogotá',
            country='Colombia',
            tax_id='NIT-DUPLICADO',
        )
        payload = {**self.valid_payload, 'tax_id': 'NIT-DUPLICADO'}
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tax_id', response.data)

    # --- Edge case ---
    def test_create_customer_without_tax_id(self):
        """POST sin tax_id (campo nullable) debe retornar 201 con tax_id=None."""
        response = self.client.post(URL_LIST, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['tax_id'])

    def test_create_customer_with_explicit_null_tax_id(self):
        """POST con tax_id=null explícito debe retornar 201."""
        payload = {**self.valid_payload, 'tax_id': None}
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['tax_id'])

    def test_two_customers_without_tax_id_both_succeed(self):
        """Crear dos clientes con tax_id=None no debe violar UNIQUE."""
        payload1 = {**self.valid_payload, 'tax_id': None}
        payload2 = {**self.valid_payload, 'email': 'otro@empresa.com', 'name': 'Otro', 'tax_id': None}
        response1 = self.client.post(URL_LIST, payload1, format='json')
        response2 = self.client.post(URL_LIST, payload2, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)


class CustomerRetrieveTest(APITestCase):
    """Tests del endpoint GET /api/v1/customers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            name='Cliente Retrieve',
            customer_type=CustomerType.COMPANY,
            email='retrieve@empresa.com',
            city='Bogotá',
            country='Colombia',
            tax_id='NIT-RETRIEVE',
        )

    # --- Happy path ---
    def test_retrieve_customer_returns_200(self):
        """GET detail con id existente debe retornar 200."""
        response = self.client.get(url_detail(self.customer.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_customer_returns_correct_data(self):
        """GET detail debe retornar los datos correctos del cliente."""
        response = self.client.get(url_detail(self.customer.id))
        self.assertEqual(response.data['id'], self.customer.id)
        self.assertEqual(response.data['name'], 'Cliente Retrieve')
        self.assertEqual(response.data['email'], 'retrieve@empresa.com')
        self.assertEqual(response.data['tax_id'], 'NIT-RETRIEVE')

    # --- Unhappy path ---
    def test_retrieve_customer_unauthenticated_returns_401(self):
        """GET detail sin autenticación debe retornar 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(url_detail(self.customer.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_customer_not_found_returns_404(self):
        """GET detail con id inexistente debe retornar 404."""
        response = self.client.get(url_detail(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class CustomerUpdateTest(APITestCase):
    """Tests del endpoint PUT /api/v1/customers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            name='Cliente Update',
            customer_type=CustomerType.COMPANY,
            email='update@empresa.com',
            city='Bogotá',
            country='Colombia',
        )
        self.valid_payload = {
            'name': 'Cliente Actualizado',
            'customer_type': 'company',
            'email': 'actualizado@empresa.com',
            'city': 'Medellín',
            'country': 'Colombia',
        }

    # --- Happy path ---
    def test_update_customer_returns_200(self):
        """PUT con datos válidos debe retornar 200."""
        response = self.client.put(url_detail(self.customer.id), self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_customer_persists_changes(self):
        """PUT debe persistir los cambios en la base de datos."""
        self.client.put(url_detail(self.customer.id), self.valid_payload, format='json')
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, 'Cliente Actualizado')
        self.assertEqual(self.customer.city, 'Medellín')

    def test_update_customer_can_change_type(self):
        """PUT puede cambiar el customer_type de company a individual."""
        payload = {**self.valid_payload, 'customer_type': 'individual'}
        response = self.client.put(url_detail(self.customer.id), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['customer_type'], 'individual')

    # --- Unhappy path ---
    def test_update_customer_unauthenticated_returns_401(self):
        """PUT sin autenticación debe retornar 401."""
        self.client.force_authenticate(user=None)
        response = self.client.put(url_detail(self.customer.id), self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_customer_not_found_returns_404(self):
        """PUT con id inexistente debe retornar 404."""
        response = self.client.put(url_detail(99999), self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_customer_missing_required_field_returns_400(self):
        """PUT sin name (campo requerido) debe retornar 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.put(url_detail(self.customer.id), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_update_customer_invalid_email_returns_400(self):
        """PUT con email inválido debe retornar 400."""
        payload = {**self.valid_payload, 'email': 'invalido'}
        response = self.client.put(url_detail(self.customer.id), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge case ---
    def test_update_customer_with_null_optional_fields(self):
        """PUT puede enviar campos opcionales como null."""
        payload = {**self.valid_payload, 'tax_id': None, 'phone': None, 'address': None}
        response = self.client.put(url_detail(self.customer.id), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['tax_id'])
        self.assertIsNone(response.data['phone'])
        self.assertIsNone(response.data['address'])


class CustomerPartialUpdateTest(APITestCase):
    """Tests del endpoint PATCH /api/v1/customers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            name='Cliente Patch',
            customer_type=CustomerType.COMPANY,
            email='patch@empresa.com',
            city='Bogotá',
            country='Colombia',
        )

    # --- Happy path ---
    def test_partial_update_name_returns_200(self):
        """PATCH con solo name debe retornar 200."""
        response = self.client.patch(
            url_detail(self.customer.id), {'name': 'Nombre Parcial'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Nombre Parcial')

    def test_partial_update_city_does_not_alter_other_fields(self):
        """PATCH en city no debe modificar otros campos."""
        response = self.client.patch(
            url_detail(self.customer.id), {'city': 'Cali'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Cali')
        self.assertEqual(response.data['name'], 'Cliente Patch')
        self.assertEqual(response.data['email'], 'patch@empresa.com')

    def test_partial_update_is_active_to_false(self):
        """PATCH puede desactivar un cliente."""
        response = self.client.patch(
            url_detail(self.customer.id), {'is_active': False}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    # --- Unhappy path ---
    def test_partial_update_unauthenticated_returns_401(self):
        """PATCH sin autenticación debe retornar 401."""
        self.client.force_authenticate(user=None)
        response = self.client.patch(
            url_detail(self.customer.id), {'name': 'x'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_partial_update_not_found_returns_404(self):
        """PATCH con id inexistente debe retornar 404."""
        response = self.client.patch(url_detail(99999), {'name': 'x'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_partial_update_invalid_email_returns_400(self):
        """PATCH con email inválido debe retornar 400."""
        response = self.client.patch(
            url_detail(self.customer.id), {'email': 'no-email'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge case ---
    def test_partial_update_set_tax_id_to_null(self):
        """PATCH puede establecer tax_id en null."""
        self.customer.tax_id = 'NIT-PATCH-001'
        self.customer.save()
        response = self.client.patch(
            url_detail(self.customer.id), {'tax_id': None}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['tax_id'])


class CustomerDestroyTest(APITestCase):
    """Tests del endpoint DELETE /api/v1/customers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = Customer.objects.create(
            name='Cliente Borrar',
            customer_type=CustomerType.COMPANY,
            email='borrar@empresa.com',
            city='Bogotá',
            country='Colombia',
        )

    # --- Happy path ---
    def test_delete_customer_returns_204(self):
        """DELETE con id existente debe retornar 204."""
        response = self.client.delete(url_detail(self.customer.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_customer_removes_from_db(self):
        """DELETE debe eliminar el cliente de la base de datos."""
        customer_id = self.customer.id
        self.client.delete(url_detail(customer_id))
        self.assertFalse(Customer.objects.filter(id=customer_id).exists())

    # --- Unhappy path ---
    def test_delete_customer_unauthenticated_returns_401(self):
        """DELETE sin autenticación debe retornar 401."""
        self.client.force_authenticate(user=None)
        response = self.client.delete(url_detail(self.customer.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_customer_not_found_returns_404(self):
        """DELETE con id inexistente debe retornar 404."""
        response = self.client.delete(url_detail(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- Edge case ---
    def test_delete_customer_already_deleted_returns_404(self):
        """DELETE sobre un cliente ya eliminado debe retornar 404."""
        customer_id = self.customer.id
        self.client.delete(url_detail(customer_id))
        response = self.client.delete(url_detail(customer_id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
