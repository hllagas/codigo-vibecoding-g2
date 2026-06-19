import io
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Product
from apps.suppliers.models import Supplier


class ProductViewSetTest(APITestCase):
    """Tests de endpoints /api/v1/products/."""

    def setUp(self):
        # Usuario autenticado — todos los endpoints requieren JWT
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        self.client.force_authenticate(user=self.user)

        # Proveedor requerido por la FK de Product
        self.supplier = Supplier.objects.create(
            name='Test Supplier',
            email='supplier@test.com',
            city='Bogota',
            country='Colombia',
        )

        # Producto base
        self.product = Product.objects.create(
            name='Laptop Pro',
            sku='LAP-001',
            category='laptop',
            unit_price=Decimal('1500.00'),
            weight_kg=Decimal('2.500'),
            supplier=self.supplier,
        )

        self.valid_payload = {
            'name': 'Smartphone X',
            'sku': 'SPH-001',
            'category': 'smartphone',
            'unit_price': '999.99',
            'weight_kg': '0.200',
            'supplier': self.supplier.id,
        }
        self.invalid_payload = {
            'name': '',            # vacio — requerido
            'sku': '',             # vacio — requerido
            'category': '',        # vacio — requerido
            'unit_price': '',      # vacio — requerido
            'weight_kg': '',       # vacio — requerido
        }

        self.url_list = '/api/v1/products/'
        self.url_detail = f'/api/v1/products/{self.product.id}/'

    # --- Happy path: operaciones CRUD ---

    def test_list_products(self):
        """GET /products/ retorna 200 con lista de productos."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_products_contains_created_product(self):
        """La lista incluye el producto creado en setUp."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        skus = [p['sku'] for p in results]
        self.assertIn('LAP-001', skus)

    def test_create_product_success(self):
        """POST /products/ con payload valido retorna 201."""
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['sku'], 'SPH-001')
        self.assertEqual(response.data['name'], 'Smartphone X')

    def test_create_product_returns_all_fields(self):
        """La respuesta de creacion incluye id, timestamps y campos del modelo."""
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_retrieve_product(self):
        """GET /products/{id}/ retorna 200 con datos del producto."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sku'], 'LAP-001')
        self.assertEqual(response.data['name'], 'Laptop Pro')

    def test_update_product_put(self):
        """PUT /products/{id}/ con payload completo retorna 200."""
        payload = {
            'name': 'Laptop Pro Updated',
            'sku': 'LAP-001',
            'category': 'laptop',
            'unit_price': '1800.00',
            'weight_kg': '2.500',
            'supplier': self.supplier.id,
        }
        response = self.client.put(self.url_detail, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Laptop Pro Updated')
        self.assertEqual(response.data['unit_price'], '1800.00')

    def test_partial_update_product_patch(self):
        """PATCH /products/{id}/ con campo parcial retorna 200."""
        response = self.client.patch(self.url_detail, {'unit_price': '1750.00'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unit_price'], '1750.00')

    def test_delete_product(self):
        """DELETE /products/{id}/ retorna 204 y el producto deja de existir."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=self.product.id).exists())

    # --- Happy path: campos opcionales ---

    def test_create_product_without_supplier(self):
        """Crear producto sin proveedor (supplier nullable) retorna 201."""
        payload = {
            'name': 'Producto sin proveedor',
            'sku': 'SKU-NOPROV-001',
            'category': 'accessory',
            'unit_price': '20.00',
            'weight_kg': '0.100',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['supplier'])

    def test_create_product_without_description(self):
        """Crear producto sin description (nullable) retorna 201."""
        payload = {
            'name': 'Producto sin descripcion',
            'sku': 'SKU-NODESC-001',
            'category': 'monitor',
            'unit_price': '350.00',
            'weight_kg': '3.500',
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['description'])

    def test_create_product_with_null_supplier_explicit(self):
        """Enviar supplier=null explicitamente retorna 201."""
        payload = {
            'name': 'Producto null supplier',
            'sku': 'SKU-NULLSUP-001',
            'category': 'server',
            'unit_price': '5000.00',
            'weight_kg': '15.000',
            'supplier': None,
        }
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['supplier'])

    # --- Unhappy path ---

    def test_unauthenticated_request_returns_401(self):
        """Peticion sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_post_returns_401(self):
        """POST sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url_list, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_product_not_found(self):
        """GET /products/{id_inexistente}/ retorna 404."""
        response = self.client.get('/api/v1/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_product_not_found(self):
        """PUT /products/{id_inexistente}/ retorna 404."""
        payload = {
            'name': 'Nada',
            'sku': 'NADA-001',
            'category': 'laptop',
            'unit_price': '100.00',
            'weight_kg': '1.000',
        }
        response = self.client.put('/api/v1/products/99999/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_product_not_found(self):
        """DELETE /products/{id_inexistente}/ retorna 404."""
        response = self.client.delete('/api/v1/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_product_missing_required_fields(self):
        """POST con campos requeridos vacios retorna 400."""
        response = self.client.post(self.url_list, self.invalid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_product_missing_name(self):
        """POST sin name retorna 400."""
        payload = {**self.valid_payload, 'name': ''}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_product_missing_sku(self):
        """POST sin sku retorna 400."""
        payload = {**self.valid_payload, 'sku': ''}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sku', response.data)

    def test_create_product_missing_category(self):
        """POST sin category retorna 400."""
        payload = {**self.valid_payload, 'category': ''}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('category', response.data)

    def test_create_product_missing_unit_price(self):
        """POST sin unit_price retorna 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'unit_price'}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('unit_price', response.data)

    def test_create_product_missing_weight_kg(self):
        """POST sin weight_kg retorna 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'weight_kg'}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('weight_kg', response.data)

    def test_create_product_duplicate_sku(self):
        """POST con SKU duplicado retorna 400."""
        payload = {**self.valid_payload, 'sku': 'LAP-001'}  # ya existe
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sku', response.data)

    def test_create_product_invalid_supplier(self):
        """POST con supplier inexistente retorna 400."""
        payload = {**self.valid_payload, 'supplier': 99999}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('supplier', response.data)

    def test_create_product_invalid_unit_price(self):
        """POST con unit_price no numerico retorna 400."""
        payload = {**self.valid_payload, 'unit_price': 'not-a-number'}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('unit_price', response.data)

    def test_create_product_invalid_weight_kg(self):
        """POST con weight_kg no numerico retorna 400."""
        payload = {**self.valid_payload, 'weight_kg': 'heavy'}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('weight_kg', response.data)

    # --- Edge cases ---

    def test_list_products_empty(self):
        """GET /products/ con DB vacia retorna 200 y lista vacia."""
        Product.objects.all().delete()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_patch_supplier_to_null(self):
        """PATCH supplier=null en producto existente retorna 200."""
        response = self.client.patch(self.url_detail, {'supplier': None}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['supplier'])

    def test_patch_is_active_to_false(self):
        """PATCH is_active=false retorna 200 y producto queda inactivo."""
        response = self.client.patch(self.url_detail, {'is_active': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    def test_create_product_with_description(self):
        """POST con description opcional retorna 201 y conserva la descripcion."""
        payload = {**self.valid_payload, 'description': 'Una descripcion de prueba'}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['description'], 'Una descripcion de prueba')

    def test_create_product_is_active_false(self):
        """POST con is_active=false retorna 201 y el producto queda inactivo."""
        payload = {**self.valid_payload, 'is_active': False}
        response = self.client.post(self.url_list, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['is_active'])

    def test_retrieve_returns_correct_supplier_id(self):
        """GET /products/{id}/ retorna el id del proveedor correcto."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['supplier'], self.supplier.id)


@override_settings(
    STORAGES={
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    }
)
class ProductImageUploadTest(APITestCase):
    """Tests del action POST /api/v1/products/{id}/upload-image/."""

    def setUp(self):
        # Usuario autenticado — todos los endpoints requieren JWT
        self.user = User.objects.create_user(
            username='imguser',
            password='testpass123',
        )
        self.client.force_authenticate(user=self.user)

        # Proveedor requerido por la FK de Product
        self.supplier = Supplier.objects.create(
            name='Image Supplier',
            email='imgsupplier@test.com',
            city='Lima',
            country='Peru',
        )

        # Producto base para los tests de imagen
        self.product = Product.objects.create(
            name='Camera HD',
            sku='CAM-IMG-001',
            category='camera',
            unit_price=Decimal('299.99'),
            weight_kg=Decimal('0.500'),
            supplier=self.supplier,
        )

        self.url_upload = f'/api/v1/products/{self.product.id}/upload-image/'

    def _make_image_file(self, name='test_image.png'):
        """Crea un PNG válido en memoria usando Pillow para evitar errores de validación."""
        img = Image.new('RGB', (10, 10), color=(255, 0, 0))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return SimpleUploadedFile(
            name,
            buf.getvalue(),
            content_type='image/png',
        )

    def test_upload_image_success(self):
        """POST con imagen válida retorna 200 y image_url no nulo en la respuesta."""
        image_file = self._make_image_file()
        response = self.client.post(
            self.url_upload,
            {'image': image_file},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data.get('image_url'))

    def test_upload_image_no_file_returns_400(self):
        """POST sin archivo retorna 400."""
        response = self.client.post(self.url_upload, {}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_image_unauthenticated_returns_401(self):
        """POST sin autenticación retorna 401."""
        self.client.force_authenticate(user=None)
        image_file = self._make_image_file()
        response = self.client.post(
            self.url_upload,
            {'image': image_file},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_image_nonexistent_product_returns_404(self):
        """POST a /products/99999/upload-image/ retorna 404."""
        image_file = self._make_image_file()
        response = self.client.post(
            '/api/v1/products/99999/upload-image/',
            {'image': image_file},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_image_url_null_when_no_image(self):
        """GET de un producto sin imagen retorna image_url: null."""
        response = self.client.get(f'/api/v1/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data.get('image_url'))

    def test_image_url_present_after_upload(self):
        """GET después de upload retorna image_url no nulo."""
        # Subir imagen primero
        image_file = self._make_image_file()
        upload_response = self.client.post(
            self.url_upload,
            {'image': image_file},
            format='multipart',
        )
        self.assertEqual(upload_response.status_code, status.HTTP_200_OK)

        # Verificar que el GET devuelve image_url con valor
        response = self.client.get(f'/api/v1/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data.get('image_url'))
