"""
Tests de CRUD del ViewSet de Shipment.

Cubre: list, create (con y sin items), retrieve, update (PUT y PATCH),
delete, filtros, búsqueda, ordenamiento, 401 y 404.
"""
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from apps.shipments.models import Shipment

from .helpers import (
    make_customer,
    make_product,
    make_route,
    make_shipment,
    make_shipment_item,
    make_warehouse,
)

URL_LIST = '/api/v1/shipments/'


def url_detail(pk):
    return f'/api/v1/shipments/{pk}/'


class ShipmentViewSetCRUDTest(APITestCase):
    """Tests CRUD estándar del ShipmentViewSet."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.product = make_product()
        self.shipment = make_shipment(self.customer, self.warehouse, tracking='TRK-BASE')
        self.valid_payload = {
            'tracking_number': 'TRK-NEW',
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'Av. Principal 100',
            'destination_city': 'Cali',
            'destination_country': 'Colombia',
            'scheduled_delivery_date': '2027-08-01',
            'total_weight_kg': '3.50',
        }

    # --- Happy path: list ---

    def test_list_shipments(self):
        """GET /shipments/ retorna 200 y la lista de envíos."""
        response = self.client.get(URL_LIST)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_shipments_empty(self):
        """GET /shipments/ con lista vacía retorna 200 y results vacío."""
        Shipment.objects.all().delete()
        response = self.client.get(URL_LIST)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    # --- Happy path: create ---

    def test_create_shipment_without_items(self):
        """POST sin items crea el envío con status=pending e items=[]."""
        response = self.client.post(URL_LIST, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertEqual(response.data['items'], [])

    def test_create_shipment_with_items(self):
        """POST con items anidados crea el envío y sus items."""
        payload = dict(self.valid_payload)
        payload['tracking_number'] = 'TRK-ITEMS'
        payload['items'] = [
            {
                'product': self.product.id,
                'quantity': 2,
                'unit_price_at_shipment': '999.99',
            }
        ]
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['quantity'], 2)

    def test_create_shipment_with_multiple_items(self):
        """POST con varios items distintos crea todos los items correctamente."""
        product2 = make_product()
        payload = dict(self.valid_payload)
        payload['tracking_number'] = 'TRK-MULTI'
        payload['items'] = [
            {'product': self.product.id, 'quantity': 1, 'unit_price_at_shipment': '999.99'},
            {'product': product2.id, 'quantity': 3, 'unit_price_at_shipment': '499.99'},
        ]
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['items']), 2)

    # --- Happy path: retrieve ---

    def test_retrieve_shipment(self):
        """GET /shipments/{id}/ retorna 200 con el envío y campo items."""
        response = self.client.get(url_detail(self.shipment.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('items', response.data)
        self.assertEqual(response.data['tracking_number'], 'TRK-BASE')

    # --- Happy path: update ---

    def test_put_shipment(self):
        """PUT /shipments/{id}/ actualiza el envío completo."""
        payload = dict(self.valid_payload)
        payload['tracking_number'] = 'TRK-BASE'
        payload['destination_city'] = 'Barranquilla'
        response = self.client.put(url_detail(self.shipment.id), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['destination_city'], 'Barranquilla')

    def test_patch_shipment_notes(self):
        """PATCH /shipments/{id}/ actualiza parcialmente un campo."""
        response = self.client.patch(
            url_detail(self.shipment.id), {'notes': 'Frágil'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['notes'], 'Frágil')

    def test_patch_shipment_items_field_ignored_on_update(self):
        """PATCH con items no modifica los items existentes (update ignora items)."""
        make_shipment_item(self.shipment, self.product, quantity=5)
        product2 = make_product()
        response = self.client.patch(
            url_detail(self.shipment.id),
            {'items': [{'product': product2.id, 'quantity': 1, 'unit_price_at_shipment': '50.00'}]},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # El serializer ignora items en update, los items originales no cambian
        from apps.shipments.models import ShipmentItem
        count = ShipmentItem.objects.filter(shipment=self.shipment).count()
        self.assertEqual(count, 1)

    # --- Happy path: delete ---

    def test_delete_shipment(self):
        """DELETE /shipments/{id}/ retorna 204 y elimina el envío."""
        response = self.client.delete(url_detail(self.shipment.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Shipment.objects.filter(id=self.shipment.id).exists())

    # --- Unhappy path: create ---

    def test_create_shipment_missing_required_field(self):
        """POST sin campo requerido retorna 400."""
        payload = dict(self.valid_payload)
        del payload['destination_city']
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_shipment_duplicate_tracking(self):
        """POST con tracking_number duplicado retorna 400."""
        payload = dict(self.valid_payload)
        payload['tracking_number'] = 'TRK-BASE'
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_shipment_duplicate_product_in_items(self):
        """POST con el mismo producto dos veces en items retorna 400."""
        payload = dict(self.valid_payload)
        payload['tracking_number'] = 'TRK-DUPITEM'
        payload['items'] = [
            {'product': self.product.id, 'quantity': 1, 'unit_price_at_shipment': '100.00'},
            {'product': self.product.id, 'quantity': 2, 'unit_price_at_shipment': '100.00'},
        ]
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_shipment_invalid_customer(self):
        """POST con customer_id inexistente retorna 400."""
        payload = dict(self.valid_payload)
        payload['tracking_number'] = 'TRK-BADCUST'
        payload['customer'] = 99999
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_shipment_invalid_warehouse(self):
        """POST con origin_warehouse_id inexistente retorna 400."""
        payload = dict(self.valid_payload)
        payload['tracking_number'] = 'TRK-BADWH'
        payload['origin_warehouse'] = 99999
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_shipment_missing_total_weight(self):
        """POST sin total_weight_kg retorna 400."""
        payload = dict(self.valid_payload)
        payload['tracking_number'] = 'TRK-NOWEIGHT'
        del payload['total_weight_kg']
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Unhappy path: retrieve/update/delete ---

    def test_retrieve_shipment_not_found(self):
        """GET /shipments/99999/ retorna 404."""
        response = self.client.get('/api/v1/shipments/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_shipment_not_found(self):
        """PUT /shipments/99999/ retorna 404."""
        response = self.client.put('/api/v1/shipments/99999/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_shipment_not_found(self):
        """DELETE /shipments/99999/ retorna 404."""
        response = self.client.delete('/api/v1/shipments/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- Unhappy path: 401 sin autenticación ---

    def test_list_unauthenticated(self):
        """GET /shipments/ sin JWT retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(URL_LIST)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated(self):
        """POST /shipments/ sin JWT retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(URL_LIST, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_unauthenticated(self):
        """GET /shipments/{id}/ sin JWT retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(url_detail(self.shipment.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_unauthenticated(self):
        """PUT /shipments/{id}/ sin JWT retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.put(url_detail(self.shipment.id), self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_unauthenticated(self):
        """DELETE /shipments/{id}/ sin JWT retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.delete(url_detail(self.shipment.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge case: route nullable ---

    def test_create_shipment_without_route(self):
        """POST sin route crea el envío con route=null."""
        payload = dict(self.valid_payload)
        payload['tracking_number'] = 'TRK-NOROUTE'
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['route'])

    def test_create_shipment_with_route(self):
        """POST con route válida asigna la ruta al envío."""
        route = make_route(warehouse=self.warehouse)
        payload = dict(self.valid_payload)
        payload['tracking_number'] = 'TRK-WITHROUTE'
        payload['route'] = route.id
        response = self.client.post(URL_LIST, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['route'], route.id)


class ShipmentViewSetFiltersTest(APITestCase):
    """Tests de filtros, búsqueda y ordenamiento del ShipmentViewSet."""

    def setUp(self):
        self.user = User.objects.create_user(username='filteruser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.shipment_pending = make_shipment(
            self.customer, self.warehouse,
            tracking='TRK-PEND',
            status='pending',
        )
        self.shipment_processing = make_shipment(
            self.customer, self.warehouse,
            tracking='TRK-PROC',
            status='processing',
        )

    def test_filter_by_status_pending(self):
        """GET ?status=pending retorna solo envíos en estado pending."""
        response = self.client.get(f'{URL_LIST}?status=pending')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        for item in results:
            self.assertEqual(item['status'], 'pending')

    def test_filter_by_status_processing(self):
        """GET ?status=processing retorna solo envíos en estado processing."""
        response = self.client.get(f'{URL_LIST}?status=processing')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        for item in results:
            self.assertEqual(item['status'], 'processing')

    def test_filter_by_customer(self):
        """GET ?customer={id} retorna solo envíos del cliente indicado."""
        response = self.client.get(f'{URL_LIST}?customer={self.customer.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        for item in results:
            self.assertEqual(item['customer'], self.customer.id)

    def test_filter_by_origin_warehouse(self):
        """GET ?origin_warehouse={id} retorna solo envíos del almacén indicado."""
        response = self.client.get(f'{URL_LIST}?origin_warehouse={self.warehouse.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        for item in results:
            self.assertEqual(item['origin_warehouse'], self.warehouse.id)

    def test_search_by_tracking_number(self):
        """GET ?search=TRK-PEND retorna el envío con ese tracking_number."""
        response = self.client.get(f'{URL_LIST}?search=TRK-PEND')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertTrue(any(item['tracking_number'] == 'TRK-PEND' for item in results))

    def test_search_by_destination_city(self):
        """GET ?search=Medellin retorna envíos con destination_city coincidente."""
        response = self.client.get(f'{URL_LIST}?search=Medellin')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertGreater(len(results), 0)

    def test_ordering_by_created_at(self):
        """GET ?ordering=created_at retorna 200 sin error."""
        response = self.client.get(f'{URL_LIST}?ordering=created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ordering_by_scheduled_delivery_date_desc(self):
        """GET ?ordering=-scheduled_delivery_date retorna 200 sin error."""
        response = self.client.get(f'{URL_LIST}?ordering=-scheduled_delivery_date')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
