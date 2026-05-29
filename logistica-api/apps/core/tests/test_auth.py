"""
Tests de autenticación JWT para logistica-api.

Cubre los endpoints:
  POST /api/v1/auth/token/          — obtener par de tokens
  POST /api/v1/auth/token/refresh/  — renovar access token

Y verifica que los endpoints protegidos rechacen requests sin token válido.
"""
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


URL_TOKEN = '/api/v1/auth/token/'
URL_REFRESH = '/api/v1/auth/token/refresh/'
URL_PROTECTED = '/api/v1/suppliers/'


class TokenObtainPairTest(APITestCase):
    """Tests de POST /api/v1/auth/token/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='logistica_test',
            password='Segura1234!',
        )
        self.valid_payload = {
            'username': 'logistica_test',
            'password': 'Segura1234!',
        }

    # --- Happy path ---

    def test_obtain_token_with_valid_credentials(self):
        """Credenciales válidas devuelven 200 con access y refresh."""
        response = self.client.post(URL_TOKEN, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_access_token_is_non_empty_string(self):
        """El access token retornado es un string no vacío."""
        response = self.client.post(URL_TOKEN, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    def test_refresh_token_is_non_empty_string(self):
        """El refresh token retornado es un string no vacío."""
        response = self.client.post(URL_TOKEN, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data['refresh'], str)
        self.assertTrue(len(response.data['refresh']) > 0)

    # --- Unhappy path ---

    def test_wrong_password_returns_401(self):
        """Password incorrecta devuelve 401."""
        payload = {'username': 'logistica_test', 'password': 'contraseña_INCORRECTA'}
        response = self.client.post(URL_TOKEN, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_user_returns_401(self):
        """Usuario que no existe en la base de datos devuelve 401."""
        payload = {'username': 'usuario_inexistente', 'password': 'cualquiera'}
        response = self.client.post(URL_TOKEN, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_body_returns_400(self):
        """Body vacío (sin username ni password) devuelve 400."""
        response = self.client.post(URL_TOKEN, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge cases ---

    def test_correct_username_empty_password_returns_400_or_401(self):
        """Username correcto pero password vacía devuelve 400 o 401."""
        payload = {'username': 'logistica_test', 'password': ''}
        response = self.client.post(URL_TOKEN, payload, format='json')
        self.assertIn(
            response.status_code,
            [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED],
        )

    def test_inactive_user_returns_401(self):
        """Usuario con is_active=False no puede obtener token — devuelve 401."""
        inactive_user = User.objects.create_user(
            username='usuario_inactivo',
            password='Segura1234!',
            is_active=False,
        )
        payload = {'username': inactive_user.username, 'password': 'Segura1234!'}
        response = self.client.post(URL_TOKEN, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TokenRefreshTest(APITestCase):
    """Tests de POST /api/v1/auth/token/refresh/."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='refresh_test_user',
            password='Segura1234!',
        )
        # Obtener un par de tokens válidos para usar en los tests
        response = self.client.post(
            URL_TOKEN,
            {'username': 'refresh_test_user', 'password': 'Segura1234!'},
            format='json',
        )
        self.access_token = response.data['access']
        self.refresh_token = response.data['refresh']

    # --- Happy path ---

    def test_valid_refresh_token_returns_200_and_access(self):
        """Refresh token válido devuelve 200 con nuevo access token."""
        response = self.client.post(
            URL_REFRESH,
            {'refresh': self.refresh_token},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_new_access_token_is_non_empty_string(self):
        """El nuevo access token es un string no vacío."""
        response = self.client.post(
            URL_REFRESH,
            {'refresh': self.refresh_token},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    # --- Unhappy path ---

    def test_invalid_refresh_token_returns_401(self):
        """Refresh token inventado (string aleatorio) devuelve 401."""
        response = self.client.post(
            URL_REFRESH,
            {'refresh': 'esto.no.es.un.token.valido'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_body_returns_400(self):
        """Body vacío (sin campo refresh) devuelve 400."""
        response = self.client.post(URL_REFRESH, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge case ---

    def test_access_token_as_refresh_returns_401(self):
        """Usar el access token en el campo refresh devuelve 401 — tipo de token incorrecto."""
        response = self.client.post(
            URL_REFRESH,
            {'refresh': self.access_token},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProtectedEndpointAuthTest(APITestCase):
    """
    Verifica que los endpoints protegidos rechacen requests sin credenciales
    o con token malformado. Usa /api/v1/suppliers/ como endpoint representativo.
    """

    # --- Edge cases ---

    def test_malformed_token_returns_401(self):
        """Token malformado en header Authorization devuelve 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.malformado.xyz')
        response = self.client.get(URL_PROTECTED)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_authorization_header_returns_401(self):
        """Request sin header Authorization devuelve 401."""
        # Sin credenciales configuradas, self.client no envía Authorization
        response = self.client.get(URL_PROTECTED)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_bearer_prefix_only_returns_401(self):
        """Header Authorization con solo 'Bearer ' sin token devuelve 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ')
        response = self.client.get(URL_PROTECTED)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_valid_access_token_grants_access(self):
        """Token válido permite acceso al endpoint protegido — verificación de integración."""
        user = User.objects.create_user(username='acceso_test', password='Segura1234!')
        token_response = self.client.post(
            URL_TOKEN,
            {'username': 'acceso_test', 'password': 'Segura1234!'},
            format='json',
        )
        access_token = token_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(URL_PROTECTED)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
