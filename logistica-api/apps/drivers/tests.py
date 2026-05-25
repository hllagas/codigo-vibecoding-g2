import datetime

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.drivers.models import Driver


class DriverModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='driver01', password='pass')

    def test_create_driver(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )
        self.assertEqual(driver.license_number, 'LIC-001')
        self.assertEqual(driver.phone, '+573001234567')
        self.assertEqual(driver.user, self.user)

    def test_is_available_default_true(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )
        self.assertTrue(driver.is_available)

    def test_license_number_unique(self):
        Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )
        user2 = User.objects.create_user(username='driver02', password='pass')
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=user2,
                license_number='LIC-001',
                license_expiry=datetime.date(2027, 12, 31),
                phone='+573009999999',
            )

    def test_cascade_delete_user_deletes_driver(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )
        driver_id = driver.id
        self.user.delete()
        self.assertFalse(Driver.objects.filter(id=driver_id).exists())


class DriverViewSetTest(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='admin', password='pass')
        self.client.force_authenticate(user=self.auth_user)
        self.driver_user = User.objects.create_user(
            username='driver01', password='pass',
            first_name='Juan', last_name='Pérez',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )

    def test_list_drivers(self):
        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_driver(self):
        new_user = User.objects.create_user(username='driver02', password='pass')
        response = self.client.post('/api/v1/drivers/', {
            'user': new_user.id,
            'license_number': 'LIC-002',
            'license_expiry': '2028-06-30',
            'phone': '+573007654321',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_detail', response.data)
        self.assertEqual(response.data['license_number'], 'LIC-002')

    def test_create_driver_duplicate_license(self):
        new_user = User.objects.create_user(username='driver03', password='pass')
        response = self.client.post('/api/v1/drivers/', {
            'user': new_user.id,
            'license_number': 'LIC-001',
            'license_expiry': '2028-06-30',
            'phone': '+573007654321',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_user_already_has_profile(self):
        response = self.client.post('/api/v1/drivers/', {
            'user': self.driver_user.id,
            'license_number': 'LIC-999',
            'license_expiry': '2028-06-30',
            'phone': '+573007654321',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_driver_has_user_detail(self):
        response = self.client.get(f'/api/v1/drivers/{self.driver.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user_detail', response.data)
        self.assertEqual(response.data['user_detail']['username'], 'driver01')

    def test_retrieve_driver_not_found(self):
        response = self.client.get('/api/v1/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_is_available(self):
        response = self.client.get('/api/v1/drivers/?is_available=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_by_license_number(self):
        response = self.client.get('/api/v1/drivers/?search=LIC-001')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_patch_is_available(self):
        response = self.client.patch(
            f'/api/v1/drivers/{self.driver.id}/',
            {'is_available': False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_available'])

    def test_delete_driver(self):
        response = self.client.delete(f'/api/v1/drivers/{self.driver.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
