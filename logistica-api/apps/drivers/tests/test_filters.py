import datetime

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.drivers.models import Driver


class DriverFilterTest(APITestCase):
    """Tests de filtrado, busqueda y ordenamiento del endpoint /api/v1/drivers/."""

    def setUp(self):
        self.auth_user = User.objects.create_user(username='testuser', password='pass')
        self.client.force_authenticate(user=self.auth_user)

        user_a = User.objects.create_user(username='alpha_driver', password='pass')
        user_b = User.objects.create_user(username='beta_driver', password='pass')

        self.driver_available = Driver.objects.create(
            user=user_a,
            license_number='LIC-AVAILABLE',
            license_expiry=datetime.date(2025, 6, 30),
            phone='+573001111111',
            is_available=True,
        )
        self.driver_unavailable = Driver.objects.create(
            user=user_b,
            license_number='LIC-BUSY',
            license_expiry=datetime.date(2028, 12, 31),
            phone='+573002222222',
            is_available=False,
        )

    # --- filterset_fields: is_available ---

    def test_filter_is_available_true(self):
        """GET /drivers/?is_available=true retorna solo los disponibles."""
        response = self.client.get('/api/v1/drivers/?is_available=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = [d['id'] for d in results]
        self.assertIn(self.driver_available.id, ids)
        self.assertNotIn(self.driver_unavailable.id, ids)

    def test_filter_is_available_false(self):
        """GET /drivers/?is_available=false retorna solo los no disponibles."""
        response = self.client.get('/api/v1/drivers/?is_available=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = [d['id'] for d in results]
        self.assertNotIn(self.driver_available.id, ids)
        self.assertIn(self.driver_unavailable.id, ids)

    # --- search_fields: license_number, phone ---

    def test_search_by_license_number(self):
        """GET /drivers/?search=LIC-AVAILABLE retorna el driver correcto."""
        response = self.client.get('/api/v1/drivers/?search=LIC-AVAILABLE')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertGreaterEqual(len(results), 1)
        license_numbers = [d['license_number'] for d in results]
        self.assertIn('LIC-AVAILABLE', license_numbers)

    def test_search_by_phone(self):
        """GET /drivers/?search=+573001111111 retorna el driver con ese telefono."""
        response = self.client.get('/api/v1/drivers/?search=%2B573001111111')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        phones = [d['phone'] for d in results]
        self.assertIn('+573001111111', phones)

    def test_search_no_results(self):
        """GET /drivers/?search=NOEXISTE retorna lista vacia."""
        response = self.client.get('/api/v1/drivers/?search=NOEXISTE_XYZABC')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    # --- ordering_fields: license_expiry, created_at ---

    def test_ordering_by_license_expiry_asc(self):
        """GET /drivers/?ordering=license_expiry retorna en orden ascendente."""
        response = self.client.get('/api/v1/drivers/?ordering=license_expiry')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        if len(results) >= 2:
            dates = [r['license_expiry'] for r in results]
            self.assertEqual(dates, sorted(dates))

    def test_ordering_by_license_expiry_desc(self):
        """GET /drivers/?ordering=-license_expiry retorna en orden descendente."""
        response = self.client.get('/api/v1/drivers/?ordering=-license_expiry')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        if len(results) >= 2:
            dates = [r['license_expiry'] for r in results]
            self.assertEqual(dates, sorted(dates, reverse=True))

    def test_ordering_by_created_at(self):
        """GET /drivers/?ordering=created_at no produce error."""
        response = self.client.get('/api/v1/drivers/?ordering=created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
