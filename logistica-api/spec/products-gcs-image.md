# Spec: products — GCS Image Storage

## Contexto

Extensión de la app `products` existente para agregar almacenamiento de imágenes de productos en Google Cloud Storage (GCS). Los productos ya tienen CRUD completo. Esta spec cubre únicamente el delta: dependencias, configuración, campo `image`, serializers y el action de upload.

El campo `image` en la tabla `products` no estaba en el schema original de `database-schema.md`, pero el usuario lo ha aprobado explícitamente como extensión del MVP.

---

## Dependencias del sistema

- App `products` implementada (Phase 3 completada).
- Cuenta de servicio GCS disponible con permiso `Storage Object Admin` en el bucket `logistica-cloud-images`.
- Archivo JSON de credenciales disponible localmente (nunca va al repo).

---

## Tareas

### TASK-01 — Agregar dependencias a `requirements.txt`

Agregar las tres líneas al final del bloque de dependencias de aplicación (antes del bloque `# production`):

```
django-storages[google]==1.14.4
google-cloud-storage==2.19.0
Pillow==11.2.1
```

Instalar en el entorno virtual:

```bash
pip install django-storages[google]==1.14.4 google-cloud-storage==2.19.0 Pillow==11.2.1
```

---

### TASK-02 — Documentar variables de entorno requeridas

Agregar las siguientes variables al archivo `.env` del proyecto. La IA NO debe crear ni modificar el `.env` — solo documentar qué debe agregar el usuario.

Variables requeridas:

```
GCS_BUCKET_NAME=logistica-cloud-images
GCS_CREDENTIALS_FILE=/ruta/absoluta/a/logistica-storage-sa-key.json
```

Nota: `GCS_CREDENTIALS_FILE` debe ser la ruta absoluta al archivo JSON de credenciales de la cuenta de servicio. Este archivo NUNCA debe agregarse al repositorio. Verificar que `.gitignore` lo excluya.

---

### TASK-03 — Configurar `storages` en `config/settings.py`

#### 3a — Agregar `storages` a `INSTALLED_APPS`

En el bloque de apps de terceros de `INSTALLED_APPS`, agregar `'storages'` junto a las demás apps de terceros (después de `'django_filters'`).

#### 3b — Agregar variables GCS con decouple

Agregar el bloque de configuración GCS después de la configuración de `STORAGES`. Leer las variables con `python-decouple`:

```python
from datetime import timedelta

# Configuración de Google Cloud Storage
GS_BUCKET_NAME = config('GCS_BUCKET_NAME', default='')
GS_CREDENTIALS_FILE = config('GCS_CREDENTIALS_FILE', default='')
GS_QUERYSTRING_AUTH = True       # URLs firmadas con expiración
GS_EXPIRATION = timedelta(minutes=15)
GS_FILE_OVERWRITE = False        # No sobreescribir archivos con el mismo nombre
GS_DEFAULT_ACL = None            # Sin ACL pública — acceso solo via URL firmada
```

`timedelta` ya está disponible en el módulo `datetime` de la stdlib — verificar que el import exista en `settings.py`.

#### 3c — Reemplazar el backend `default` en `STORAGES`

Reemplazar el backend `default` actual (`FileSystemStorage`) con `GoogleCloudStorage` solo cuando `GCS_BUCKET_NAME` esté configurado. Si no está configurado, mantener `FileSystemStorage` como fallback para desarrollo sin credenciales.

Lógica condicional:

```python
if GS_BUCKET_NAME:
    STORAGES['default'] = {
        'BACKEND': 'storages.backends.gcloud.GoogleCloudStorage',
    }
```

Esta lógica va después de la definición del bloque `STORAGES`.

---

### TASK-04 — Agregar campo `image` al modelo `Product`

En `apps/products/models.py`, agregar el campo `image` al modelo `Product`:

```python
image = models.ImageField(upload_to='products/', null=True, blank=True)
```

Posición: después del campo `supplier`, antes de `is_active`.

Detalles:
- `upload_to='products/'` — subcarpeta dentro del bucket GCS (o del directorio `MEDIA_ROOT` en fallback local).
- `null=True, blank=True` — campo opcional; los productos existentes no se ven afectados.
- `ImageField` requiere Pillow instalado (cubierto en TASK-01).

---

### TASK-05 — Crear migración y aplicarla

Ejecutar:

```bash
python manage.py makemigrations products --name add_image_field
python manage.py migrate
```

Verificar que la migración agrega únicamente la columna `image` a la tabla `products`.

---

### TASK-06 — Actualizar serializers en `apps/products/serializers.py`

Reemplazar el contenido actual con dos serializers:

#### `ProductSerializer` (serializer principal — lectura y escritura general)

- `fields`: lista explícita de todos los campos del modelo **excepto** `image` — en su lugar exponer `image_url`.
- `image_url`: `SerializerMethodField` de solo lectura que retorna `obj.image.url` si el producto tiene imagen, `None` si no.
- El campo `image` del modelo NO se expone en este serializer (el cliente no puede subir imagen a través del CRUD general).

Campos a incluir: `id`, `name`, `description`, `sku`, `category`, `unit_price`, `weight_kg`, `supplier`, `is_active`, `created_at`, `updated_at`, `image_url`.

```python
class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField(read_only=True)

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'category',
            'unit_price', 'weight_kg', 'supplier',
            'is_active', 'created_at', 'updated_at', 'image_url',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
```

#### `ProductImageUploadSerializer` (serializer para el action de upload)

- Solo acepta el campo `image`.
- Usado exclusivamente por el action `upload_image`.

```python
class ProductImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['image']
```

---

### TASK-07 — Agregar action `upload_image` en `apps/products/views.py`

Agregar el action al `ProductViewSet` existente. No modificar la estructura base del ViewSet.

Imports adicionales necesarios:

```python
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse
from .serializers import ProductSerializer, ProductImageUploadSerializer
```

Action a agregar:

```python
@extend_schema(
    summary='Subir imagen del producto',
    description='Sube o reemplaza la imagen de un producto. Acepta multipart/form-data con el campo image.',
    request=ProductImageUploadSerializer,
    responses={
        200: ProductSerializer,
        400: OpenApiResponse(description='Imagen inválida o no proporcionada'),
    },
    tags=['products'],
)
@action(
    detail=True,
    methods=['post'],
    url_path='upload-image',
    parser_classes=[MultiPartParser],
)
def upload_image(self, request, pk=None):
    """Sube o reemplaza la imagen del producto al bucket GCS configurado."""
    product = self.get_object()
    serializer = ProductImageUploadSerializer(product, data=request.data)
    if serializer.is_valid():
        serializer.save()
        # Retornar el producto completo con la URL firmada de la imagen
        return Response(ProductSerializer(product, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

El action genera el endpoint:

```
POST /api/v1/products/{id}/upload-image/
Content-Type: multipart/form-data
Body: image=<file>
Response: ProductSerializer completo (incluye image_url con URL firmada válida 15 min)
```

---

### TASK-08 — Escribir tests para la nueva funcionalidad

Agregar tests en `apps/products/tests/test_views.py` — NO reemplazar los tests existentes, solo agregar nuevos casos al final.

Tests a agregar en una clase separada `ProductImageUploadTest`:

1. `test_upload_image_success` — POST con imagen válida retorna 200 y `image_url` en la respuesta.
2. `test_upload_image_no_file_returns_400` — POST sin archivo retorna 400.
3. `test_upload_image_unauthenticated_returns_401` — POST sin autenticación retorna 401.
4. `test_upload_image_nonexistent_product_returns_404` — POST a `/products/99999/upload-image/` retorna 404.
5. `test_image_url_null_when_no_image` — GET de un producto sin imagen retorna `image_url: null`.
6. `test_image_url_present_after_upload` — GET después de upload retorna `image_url` no nulo.

Para mockear GCS en los tests, usar `unittest.mock.patch` sobre `storages.backends.gcloud.GoogleCloudStorage.save` para que no haga llamadas reales al bucket. Alternativamente, configurar `DEFAULT_FILE_STORAGE` en el test override para usar `FileSystemStorage` con `override_settings`.

Patrón recomendado para el mock en tests:

```python
from unittest.mock import patch, MagicMock
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

@override_settings(
    STORAGES={
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    }
)
class ProductImageUploadTest(APITestCase):
    ...
```

Usar `SimpleUploadedFile` para simular el archivo:

```python
image_file = SimpleUploadedFile(
    'test_image.jpg',
    b'\xff\xd8\xff\xe0',  # bytes mínimos de JPEG válido para Pillow
    content_type='image/jpeg',
)
```

---

## Criterios de aceptación

1. `pip install` de las tres dependencias no genera errores.
2. `python manage.py makemigrations products --name add_image_field` genera una migración con un único `AddField` para `image`.
3. `python manage.py migrate` aplica la migración sin errores.
4. Los tests existentes de `products` siguen pasando sin modificación.
5. `POST /api/v1/products/{id}/upload-image/` con una imagen válida retorna 200 con `image_url` no nulo.
6. `POST /api/v1/products/{id}/upload-image/` sin archivo retorna 400.
7. `POST /api/v1/products/{id}/upload-image/` sin autenticación retorna 401.
8. `GET /api/v1/products/{id}/` retorna `image_url: null` para productos sin imagen.
9. `GET /api/v1/products/{id}/` retorna `image_url` con URL firmada después de subir imagen.
10. El campo `image` NO aparece en la respuesta de `GET /api/v1/products/` ni en el body de `POST /api/v1/products/`.
11. `python manage.py test products` ejecuta todos los tests sin fallos.
12. El endpoint `upload-image` aparece en `/api/docs/` con `multipart/form-data` documentado.
13. Las credenciales GCS (archivo JSON) no están en ningún archivo del repo.

---

## Archivos a modificar / crear

| Archivo | Acción |
|---|---|
| `requirements.txt` | Agregar 3 dependencias |
| `config/settings.py` | Agregar `storages` a INSTALLED_APPS, variables GCS, reemplazar backend default |
| `apps/products/models.py` | Agregar campo `image` |
| `apps/products/serializers.py` | Reemplazar con `ProductSerializer` + `ProductImageUploadSerializer` |
| `apps/products/views.py` | Agregar action `upload_image` y imports necesarios |
| `apps/products/tests/test_views.py` | Agregar clase `ProductImageUploadTest` al final |

Migración generada automáticamente:

| Archivo | Acción |
|---|---|
| `apps/products/migrations/000X_add_image_field.py` | Creado por `makemigrations` |

## Archivos que el usuario debe gestionar manualmente (no van al repo)

| Archivo | Descripción |
|---|---|
| `.env` | Agregar `GCS_BUCKET_NAME` y `GCS_CREDENTIALS_FILE` |
| `logistica-storage-sa-key.json` | Archivo de credenciales GCS — verificar que está en `.gitignore` |
