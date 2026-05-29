"""
Tests de la acción custom PATCH /shipments/{id}/status/.

Cubre: todas las transiciones válidas, todas las transiciones inválidas
desde cada estado, estados terminales, payload vacío, estado desconocido,
404 y 401.
"""
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .helpers import make_customer, make_shipment, make_warehouse


def status_url(pk):
    return f'/api/v1/shipments/{pk}/status/'


class ShipmentStatusActionTest(APITestCase):
    """Tests de la acción PATCH /shipments/{id}/status/."""

    def setUp(self):
        self.user = User.objects.create_user(username='statususer', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        # Crear un envío en pending para cada test lo necesite
        self.shipment = make_shipment(self.customer, self.warehouse)

    def _set_status(self, shipment, new_status):
        """Cambiar el status directamente en DB (para preparar el estado inicial)."""
        shipment.status = new_status
        shipment.save(update_fields=['status', 'updated_at'])

    # --- Happy path: transiciones válidas ---

    def test_transition_pending_to_processing(self):
        """pending → processing es una transición válida."""
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'processing'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'processing')

    def test_transition_pending_to_cancelled(self):
        """pending → cancelled es una transición válida."""
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'cancelled'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelled')

    def test_transition_processing_to_in_transit(self):
        """processing → in_transit es una transición válida."""
        self._set_status(self.shipment, 'processing')
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'in_transit'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_transit')

    def test_transition_processing_to_cancelled(self):
        """processing → cancelled es una transición válida."""
        self._set_status(self.shipment, 'processing')
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'cancelled'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelled')

    def test_transition_in_transit_to_delivered(self):
        """in_transit → delivered es una transición válida."""
        self._set_status(self.shipment, 'in_transit')
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'delivered'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'delivered')

    def test_transition_in_transit_to_returned(self):
        """in_transit → returned es una transición válida."""
        self._set_status(self.shipment, 'in_transit')
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'returned'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'returned')

    # --- Unhappy path: transiciones inválidas ---

    def test_invalid_transition_pending_to_in_transit(self):
        """pending → in_transit no está permitido, retorna 400."""
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'in_transit'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_transition_pending_to_delivered(self):
        """pending → delivered no está permitido, retorna 400."""
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'delivered'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_transition_pending_to_returned(self):
        """pending → returned no está permitido, retorna 400."""
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'returned'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_transition_processing_to_pending(self):
        """processing → pending no está permitido, retorna 400."""
        self._set_status(self.shipment, 'processing')
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'pending'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_transition_processing_to_delivered(self):
        """processing → delivered no está permitido, retorna 400."""
        self._set_status(self.shipment, 'processing')
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'delivered'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_transition_in_transit_to_pending(self):
        """in_transit → pending no está permitido, retorna 400."""
        self._set_status(self.shipment, 'in_transit')
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'pending'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_transition_in_transit_to_processing(self):
        """in_transit → processing no está permitido, retorna 400."""
        self._set_status(self.shipment, 'in_transit')
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'processing'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_transition_in_transit_to_cancelled(self):
        """in_transit → cancelled no está permitido, retorna 400."""
        self._set_status(self.shipment, 'in_transit')
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'cancelled'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge case: estados terminales ---

    def test_terminal_state_delivered_cannot_transition(self):
        """Estado terminal 'delivered': cualquier transición retorna 400."""
        self._set_status(self.shipment, 'delivered')
        for target in ['pending', 'processing', 'in_transit', 'cancelled', 'returned']:
            with self.subTest(target=target):
                response = self.client.patch(
                    status_url(self.shipment.id),
                    {'status': target},
                    format='json',
                )
                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                    msg=f'delivered → {target} debería retornar 400',
                )

    def test_terminal_state_cancelled_cannot_transition(self):
        """Estado terminal 'cancelled': cualquier transición retorna 400."""
        self._set_status(self.shipment, 'cancelled')
        for target in ['pending', 'processing', 'in_transit', 'delivered', 'returned']:
            with self.subTest(target=target):
                response = self.client.patch(
                    status_url(self.shipment.id),
                    {'status': target},
                    format='json',
                )
                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                    msg=f'cancelled → {target} debería retornar 400',
                )

    def test_terminal_state_returned_cannot_transition(self):
        """Estado terminal 'returned': cualquier transición retorna 400."""
        self._set_status(self.shipment, 'returned')
        for target in ['pending', 'processing', 'in_transit', 'delivered', 'cancelled']:
            with self.subTest(target=target):
                response = self.client.patch(
                    status_url(self.shipment.id),
                    {'status': target},
                    format='json',
                )
                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                    msg=f'returned → {target} debería retornar 400',
                )

    # --- Edge case: payload inválido ---

    def test_status_action_empty_payload(self):
        """PATCH /status/ con payload vacío retorna 400."""
        response = self.client.patch(
            status_url(self.shipment.id),
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_action_unknown_status_value(self):
        """PATCH /status/ con valor de status desconocido retorna 400."""
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'flying'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_action_missing_status_field(self):
        """PATCH /status/ sin campo 'status' en el payload retorna 400."""
        response = self.client.patch(
            status_url(self.shipment.id),
            {'notes': 'algo'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Unhappy path: 404 ---

    def test_status_action_not_found(self):
        """PATCH /shipments/99999/status/ retorna 404."""
        response = self.client.patch(
            '/api/v1/shipments/99999/status/',
            {'status': 'processing'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- Unhappy path: 401 ---

    def test_status_action_unauthenticated(self):
        """PATCH /status/ sin JWT retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'processing'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge case: same status ---

    def test_transition_to_same_status_invalid(self):
        """Transicionar a mismo estado (pending → pending) no está permitido."""
        response = self.client.patch(
            status_url(self.shipment.id),
            {'status': 'pending'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
