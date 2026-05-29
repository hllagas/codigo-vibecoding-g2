import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.drivers.models import Driver
from apps.transports.models import Transport, TransportType


class TransportViewSetTest(APITestCase):
    """Tests de CRUD para /api/v1/transports/."""

    def setUp(self):
        self.auth_user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.client.force_authenticate(user=self.auth_user)

        driver_user = User.objects.create_user(username='driver01', password='pass')
        self.driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )

        self.transport = Transport.objects.create(
            name='Camion Principal',
            plate_number='CAM-001',
            transport_type=TransportType.TRUCK,
            capacity_kg=Decimal('2000.00'),
        )

        self.valid_payload = {
            'name': 'Van Nueva',
            'plate_number': 'VAN-002',
            'transport_type': 'van',
            'capacity_kg': '600.00',
        }
        self.url_list = '/api/v1/transports/'
        self.url_detail = f'/api/v1/transports/{self.transport.id}/'

    # --- Happy path: LIST ---

    def test_list_transports_returns_200(self):
        """GET /transports/ retorna 200 con lista paginada."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_transports_includes_created_item(self):
        """La lista contiene el transporte creado en setUp."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [item['plate_number'] for item in response.data['results']]
        self.assertIn('CAM-001', plates)

    # --- Happy path: CREATE ---

    def test_create_transport_without_driver_returns_201(self):
        """POST sin driver crea el transporte con driver=null."""
        response = self.client.post(self.url_list, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['driver'])

    def test_create_transport_without_driver_driver_detail_null(self):
        """POST sin driver retorna driver_detail=null en la respuesta."""
        response = self.client.post(self.url_list, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['driver_detail'])

    def test_create_transport_with_driver_returns_201(self):
        """POST con driver valido crea el transporte y retorna driver_detail."""
        payload = {
            'name': 'Camion Asignado',
            'plate_number': 'CAM-002',
            'transport_type': 'truck',
            'capacity_kg': '1500.00',
            'driver': self.driver.id,
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['driver'], self.driver.id)
        self.assertIsNotNone(response.data['driver_detail'])
        self.assertEqual(response.data['driver_detail']['license_number'], 'LIC-001')

    def test_create_transport_all_valid_types(self):
        """Cada valor valido de transport_type es aceptado con 201."""
        valid_types = ['truck', 'van', 'motorcycle', 'bicycle']
        for i, transport_type in enumerate(valid_types):
            payload = {
                'name': f'Vehiculo {transport_type}',
                'plate_number': f'TYP-{i:03d}',
                'transport_type': transport_type,
                'capacity_kg': '100.00',
            }
            response = self.client.post(self.url_list, payload)
            self.assertEqual(
                response.status_code, status.HTTP_201_CREATED,
                msg=f"transport_type='{transport_type}' deberia aceptarse"
            )

    # --- Happy path: RETRIEVE ---

    def test_retrieve_transport_returns_200(self):
        """GET /transports/{id}/ retorna 200 con datos del transporte."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['plate_number'], 'CAM-001')

    def test_retrieve_transport_contains_driver_detail_field(self):
        """La respuesta de retrieve incluye el campo driver_detail."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('driver_detail', response.data)

    # --- Happy path: UPDATE (PUT) ---

    def test_update_transport_returns_200(self):
        """PUT con payload completo actualiza el transporte."""
        payload = {
            'name': 'Camion Actualizado',
            'plate_number': 'CAM-001',
            'transport_type': 'van',
            'capacity_kg': '1800.00',
        }
        response = self.client.put(self.url_detail, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Camion Actualizado')
        self.assertEqual(response.data['transport_type'], 'van')

    def test_update_transport_assign_driver(self):
        """PUT puede asignar un driver a un transporte que no tenia."""
        payload = {
            'name': 'Camion Principal',
            'plate_number': 'CAM-001',
            'transport_type': 'truck',
            'capacity_kg': '2000.00',
            'driver': self.driver.id,
        }
        response = self.client.put(self.url_detail, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['driver'], self.driver.id)

    def test_update_transport_remove_driver(self):
        """PUT puede quitar el driver de un transporte (driver=null)."""
        transport_with_driver = Transport.objects.create(
            name='Van con Driver',
            plate_number='VAN-DRV',
            transport_type=TransportType.VAN,
            capacity_kg=Decimal('600.00'),
            driver=self.driver,
        )
        payload = {
            'name': 'Van con Driver',
            'plate_number': 'VAN-DRV',
            'transport_type': 'van',
            'capacity_kg': '600.00',
            'driver': None,
        }
        url = f'/api/v1/transports/{transport_with_driver.id}/'
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['driver'])

    # --- Happy path: PARTIAL UPDATE (PATCH) ---

    def test_patch_transport_is_active(self):
        """PATCH puede cambiar is_active a False."""
        response = self.client.patch(
            self.url_detail, {'is_active': False}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    def test_patch_transport_name(self):
        """PATCH puede actualizar solo el nombre."""
        response = self.client.patch(
            self.url_detail, {'name': 'Camion Renombrado'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Camion Renombrado')

    def test_patch_transport_assign_driver(self):
        """PATCH puede asignar un driver."""
        response = self.client.patch(
            self.url_detail, {'driver': self.driver.id}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['driver'], self.driver.id)

    # --- Happy path: DELETE ---

    def test_delete_transport_returns_204(self):
        """DELETE elimina el transporte y retorna 204."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Transport.objects.filter(id=self.transport.id).exists())

    # --- Unhappy path: CREATE errors ---

    def test_create_transport_missing_name_returns_400(self):
        """POST sin name retorna 400."""
        payload = {
            'plate_number': 'NEW-001',
            'transport_type': 'van',
            'capacity_kg': '500.00',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transport_missing_plate_number_returns_400(self):
        """POST sin plate_number retorna 400."""
        payload = {
            'name': 'Sin Placa',
            'transport_type': 'van',
            'capacity_kg': '500.00',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transport_missing_transport_type_returns_400(self):
        """POST sin transport_type retorna 400."""
        payload = {
            'name': 'Sin Tipo',
            'plate_number': 'NEW-002',
            'capacity_kg': '500.00',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transport_missing_capacity_kg_returns_400(self):
        """POST sin capacity_kg retorna 400."""
        payload = {
            'name': 'Sin Capacidad',
            'plate_number': 'NEW-003',
            'transport_type': 'van',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transport_invalid_type_returns_400(self):
        """POST con transport_type invalido retorna 400."""
        payload = {
            'name': 'Helicoptero',
            'plate_number': 'HEL-001',
            'transport_type': 'helicopter',
            'capacity_kg': '500.00',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transport_duplicate_plate_returns_400(self):
        """POST con plate_number duplicado retorna 400."""
        payload = {
            'name': 'Duplicado',
            'plate_number': 'CAM-001',  # ya existe en setUp
            'transport_type': 'truck',
            'capacity_kg': '1000.00',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transport_nonexistent_driver_returns_400(self):
        """POST con driver ID inexistente retorna 400."""
        payload = {
            'name': 'Con Driver Falso',
            'plate_number': 'FAL-001',
            'transport_type': 'van',
            'capacity_kg': '500.00',
            'driver': 99999,
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transport_empty_name_returns_400(self):
        """POST con name vacio retorna 400."""
        payload = {
            'name': '',
            'plate_number': 'EMP-001',
            'transport_type': 'van',
            'capacity_kg': '500.00',
        }
        response = self.client.post(self.url_list, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Unhappy path: not found ---

    def test_retrieve_transport_not_found_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/transports/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_transport_not_found_returns_404(self):
        """PUT con id inexistente retorna 404."""
        payload = {
            'name': 'No existe',
            'plate_number': 'NOX-001',
            'transport_type': 'van',
            'capacity_kg': '500.00',
        }
        response = self.client.put('/api/v1/transports/99999/', payload)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_transport_not_found_returns_404(self):
        """PATCH con id inexistente retorna 404."""
        response = self.client.patch('/api/v1/transports/99999/', {'name': 'X'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_transport_not_found_returns_404(self):
        """DELETE con id inexistente retorna 404."""
        response = self.client.delete('/api/v1/transports/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- Edge case ---

    def test_list_transports_empty(self):
        """Lista retorna resultados vacios cuando no hay transportes."""
        Transport.objects.all().delete()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', response.data)), 0)

    def test_create_transport_with_null_driver_explicitly(self):
        """POST con driver=null explicito retorna 201 y driver=null."""
        payload = {
            'name': 'Libre',
            'plate_number': 'LIB-001',
            'transport_type': 'bicycle',
            'capacity_kg': '20.00',
            'driver': None,
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['driver'])

    def test_response_contains_all_expected_fields(self):
        """La respuesta de retrieve incluye todos los campos del modelo."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_fields = [
            'id', 'name', 'plate_number', 'transport_type',
            'capacity_kg', 'driver', 'driver_detail',
            'is_active', 'created_at', 'updated_at',
        ]
        for field in expected_fields:
            self.assertIn(field, response.data, msg=f"Campo '{field}' ausente en la respuesta")

    def test_created_at_and_updated_at_in_response(self):
        """La respuesta incluye timestamps created_at y updated_at no nulos."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['created_at'])
        self.assertIsNotNone(response.data['updated_at'])
