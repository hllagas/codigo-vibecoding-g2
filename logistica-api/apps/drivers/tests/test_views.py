import datetime

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.drivers.models import Driver


class DriverViewSetTest(APITestCase):
    """Tests de los endpoints CRUD /api/v1/drivers/."""

    def setUp(self):
        # Usuario autenticado para el cliente de la API
        self.auth_user = User.objects.create_user(username='testuser', password='pass')
        self.client.force_authenticate(user=self.auth_user)

        # Usuario separado para ser asignado al Driver (no puede ser el mismo que auth_user)
        self.driver_user = User.objects.create_user(
            username='driver01',
            password='pass',
            first_name='Juan',
            last_name='Perez',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )

        self.url_list = '/api/v1/drivers/'
        self.url_detail = f'/api/v1/drivers/{self.driver.id}/'

        # Nuevo usuario disponible para tests que crean Drivers
        self.new_user = User.objects.create_user(username='driver02', password='pass')

        self.valid_payload = {
            'user': self.new_user.id,
            'license_number': 'LIC-002',
            'license_expiry': '2028-06-30',
            'phone': '+573007654321',
        }
        self.invalid_payload = {
            'user': self.new_user.id,
            'license_number': '',
            'license_expiry': '2028-06-30',
            'phone': '+573007654321',
        }

    # --- Happy path: LIST ---

    def test_list_drivers_returns_200(self):
        """GET /drivers/ retorna 200 con lista paginada."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_drivers_contains_results(self):
        """GET /drivers/ retorna al menos el driver creado en setUp."""
        response = self.client.get(self.url_list)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_list_drivers_includes_user_detail(self):
        """Cada driver en la lista incluye el campo user_detail."""
        response = self.client.get(self.url_list)
        results = response.data.get('results', [])
        self.assertTrue(len(results) > 0)
        self.assertIn('user_detail', results[0])

    # --- Happy path: CREATE ---

    def test_create_driver_success(self):
        """POST /drivers/ con datos validos crea driver y retorna 201."""
        response = self.client.post(self.url_list, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['license_number'], 'LIC-002')

    def test_create_driver_returns_user_detail(self):
        """POST /drivers/ retorna user_detail en la respuesta."""
        response = self.client.post(self.url_list, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_detail', response.data)

    def test_create_driver_is_available_defaults_true(self):
        """POST /drivers/ sin is_available (JSON) -> is_available=True por defecto."""
        fresh_user = User.objects.create_user(username='driver_fresh', password='pass')
        payload = {
            'user': fresh_user.id,
            'license_number': 'LIC-FRESH',
            'license_expiry': '2028-06-30',
            'phone': '+573007654321',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_available'])

    # --- Happy path: RETRIEVE ---

    def test_retrieve_driver_success(self):
        """GET /drivers/{id}/ retorna 200 con datos del driver."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.driver.id)

    def test_retrieve_driver_has_user_detail(self):
        """GET /drivers/{id}/ incluye user_detail con datos del usuario."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user_detail', response.data)
        self.assertEqual(response.data['user_detail']['username'], 'driver01')
        self.assertEqual(response.data['user_detail']['first_name'], 'Juan')

    # --- Happy path: UPDATE (PUT) ---

    def test_update_driver_success(self):
        """PUT /drivers/{id}/ con datos validos actualiza el driver."""
        payload = {
            'user': self.driver_user.id,
            'license_number': 'LIC-001-UPD',
            'license_expiry': '2029-01-01',
            'phone': '+573009999999',
            'is_available': False,
        }
        response = self.client.put(self.url_detail, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['license_number'], 'LIC-001-UPD')
        self.assertFalse(response.data['is_available'])

    # --- Happy path: PARTIAL UPDATE (PATCH) ---

    def test_partial_update_is_available(self):
        """PATCH /drivers/{id}/ con is_available=False actualiza solo ese campo."""
        response = self.client.patch(self.url_detail, {'is_available': False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_available'])

    def test_partial_update_phone(self):
        """PATCH /drivers/{id}/ actualiza el telefono correctamente."""
        response = self.client.patch(self.url_detail, {'phone': '+573008888888'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '+573008888888')

    def test_partial_update_license_number(self):
        """PATCH /drivers/{id}/ actualiza license_number correctamente."""
        response = self.client.patch(
            self.url_detail, {'license_number': 'LIC-001-PATCH'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['license_number'], 'LIC-001-PATCH')

    # --- Happy path: DELETE ---

    def test_delete_driver_success(self):
        """DELETE /drivers/{id}/ elimina el driver y retorna 204."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Driver.objects.filter(id=self.driver.id).exists())

    # --- Unhappy path ---

    def test_create_driver_missing_license_number(self):
        """POST /drivers/ sin license_number retorna 400."""
        response = self.client.post(self.url_list, self.invalid_payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_missing_phone(self):
        """POST /drivers/ sin phone retorna 400."""
        payload = {
            'user': self.new_user.id,
            'license_number': 'LIC-NEW',
            'license_expiry': '2028-06-30',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_missing_license_expiry(self):
        """POST /drivers/ sin license_expiry retorna 400."""
        payload = {
            'user': self.new_user.id,
            'license_number': 'LIC-NEW',
            'phone': '+573001234567',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_missing_user(self):
        """POST /drivers/ sin user retorna 400."""
        payload = {
            'license_number': 'LIC-NEW',
            'license_expiry': '2028-06-30',
            'phone': '+573001234567',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_duplicate_license_number(self):
        """POST /drivers/ con license_number duplicado retorna 400."""
        response = self.client.post(self.url_list, {
            'user': self.new_user.id,
            'license_number': 'LIC-001',
            'license_expiry': '2028-06-30',
            'phone': '+573007654321',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_user_already_has_profile(self):
        """POST /drivers/ con un User que ya tiene Driver retorna 400."""
        response = self.client.post(self.url_list, {
            'user': self.driver_user.id,
            'license_number': 'LIC-999',
            'license_expiry': '2028-06-30',
            'phone': '+573007654321',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_driver_not_found(self):
        """GET /drivers/99999/ retorna 404."""
        response = self.client.get('/api/v1/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_driver_not_found(self):
        """PUT /drivers/99999/ retorna 404."""
        payload = {
            'user': self.driver_user.id,
            'license_number': 'LIC-001',
            'license_expiry': '2027-12-31',
            'phone': '+573001234567',
        }
        response = self.client.put('/api/v1/drivers/99999/', payload)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_driver_not_found(self):
        """DELETE /drivers/99999/ retorna 404."""
        response = self.client.delete('/api/v1/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_list_returns_401(self):
        """GET /drivers/ sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        """POST /drivers/ sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url_list, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve_returns_401(self):
        """GET /drivers/{id}/ sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_delete_returns_401(self):
        """DELETE /drivers/{id}/ sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_list_drivers_empty(self):
        """GET /drivers/ cuando no hay drivers retorna lista vacia."""
        Driver.objects.all().delete()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('count', len(response.data.get('results', response.data))), 0)

    def test_create_driver_invalid_license_expiry_format(self):
        """POST /drivers/ con formato de fecha invalido retorna 400."""
        payload = {
            'user': self.new_user.id,
            'license_number': 'LIC-NEW',
            'license_expiry': 'not-a-date',
            'phone': '+573001234567',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_read_only_fields_not_writable(self):
        """POST /drivers/ ignora campos read_only como created_at."""
        payload = {**self.valid_payload, 'created_at': '2000-01-01T00:00:00Z'}
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # created_at debe ser reciente, no el valor enviado
        self.assertNotEqual(response.data['created_at'][:4], '2000')
