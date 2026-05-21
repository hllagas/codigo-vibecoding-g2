# Arquitectura de desarrollo — logistica-api MVP

## Principios que guían este diseño

- **MVP primero**: CRUD completo antes que lógica avanzada. Sin optimizaciones prematuras.
- **Una app por dominio**: cada módulo del schema es una app Django independiente.
- **Convención sobre configuración**: usar DRF `ModelViewSet` + `DefaultRouter` para reducir código repetitivo.
- **Contrato explícito**: la API siempre retorna JSON consistente. Los errores tienen estructura uniforme.
- **Seguridad por defecto**: todos los endpoints requieren autenticación, excepto los de token JWT.

---

## Stack de dependencias

Agregar a `requirements.txt`:

```
djangorestframework-simplejwt==5.x   # Autenticación JWT
django-filter==24.x                  # Filtrado declarativo
drf-spectacular==0.27.x              # Documentación OpenAPI automática
```

---

## Estructura de carpetas

```
logistica-api/
├── config/
│   ├── settings.py       # Settings centralizados con python-decouple
│   ├── urls.py           # Raíz: incluye todas las apps bajo /api/v1/
│   ├── wsgi.py
│   └── asgi.py
│
├── customers/
├── suppliers/
├── warehouses/
├── products/
├── drivers/
├── transports/
├── routes/
├── shipments/
│
├── docs/
│   ├── database-schema.md
│   └── architecture.md
│
├── manage.py
└── requirements.txt
```

### Estructura interna de cada app

Todas las apps siguen la misma convención:

```
app_name/
├── apps.py
├── models.py
├── serializers.py
├── views.py
├── urls.py
├── filters.py        # FilterSet de django-filter
└── tests/
    ├── __init__.py
    ├── test_models.py
    └── test_views.py
```

> `filters.py` se crea solo si la app necesita filtrado personalizado. Para filtros simples alcanza con `filterset_fields` en el ViewSet.

---

## Configuración global de DRF

En `config/settings.py`:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

---

## Patrón de implementación por app

### 1. Modelo (`models.py`)

```python
class Supplier(models.Model):
    name = models.CharField(max_length=255)
    # ...campos según database-schema.md
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers'
        ordering = ['name']
```

Todos los modelos definen `db_table` explícito para coincidir con el schema. `created_at` y `updated_at` usan `auto_now_add` y `auto_now` respectivamente.

Los campos `enum` se implementan con `TextChoices`:

```python
class TransportType(models.TextChoices):
    TRUCK = 'truck', 'Camión'
    VAN = 'van', 'Furgoneta'
    MOTORCYCLE = 'motorcycle', 'Motocicleta'
    BICYCLE = 'bicycle', 'Bicicleta'
```

### 2. Serializador (`serializers.py`)

Para MVP, un `ModelSerializer` por modelo. Nested reads usan `depth` o serializadores anidados de solo lectura.

```python
class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
```

**Excepción**: `ShipmentSerializer` necesita escritura anidada para crear `shipment_items` en la misma request. Usar `create()` sobreescrito.

### 3. Vista (`views.py`)

```python
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    filterset_fields = ['city', 'country', 'is_active']
    search_fields = ['name', 'email', 'tax_id']
    ordering_fields = ['name', 'created_at']
```

### 4. URLs (`urls.py`)

```python
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)

urlpatterns = router.urls
```

### 5. Registro en `config/urls.py`

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        path('auth/', include('rest_framework_simplejwt.urls')),
        path('', include('suppliers.urls')),
        path('', include('warehouses.urls')),
        path('', include('customers.urls')),
        path('', include('products.urls')),
        path('', include('drivers.urls')),
        path('', include('transports.urls')),
        path('', include('routes.urls')),
        path('', include('shipments.urls')),
    ])),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
```

---

## Endpoints de la API

Prefijo base: `/api/v1/`

### Autenticación
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/auth/token/` | Obtener par de tokens JWT |
| POST | `/auth/token/refresh/` | Renovar access token |

### Recursos CRUD (todos requieren `Authorization: Bearer <token>`)
| Recurso | Endpoints generados por Router |
|---|---|
| `suppliers` | GET/POST `/suppliers/` · GET/PUT/PATCH/DELETE `/suppliers/{id}/` |
| `warehouses` | GET/POST `/warehouses/` · GET/PUT/PATCH/DELETE `/warehouses/{id}/` |
| `customers` | GET/POST `/customers/` · GET/PUT/PATCH/DELETE `/customers/{id}/` |
| `products` | GET/POST `/products/` · GET/PUT/PATCH/DELETE `/products/{id}/` |
| `drivers` | GET/POST `/drivers/` · GET/PUT/PATCH/DELETE `/drivers/{id}/` |
| `transports` | GET/POST `/transports/` · GET/PUT/PATCH/DELETE `/transports/{id}/` |
| `routes` | GET/POST `/routes/` · GET/PUT/PATCH/DELETE `/routes/{id}/` |
| `shipments` | GET/POST `/shipments/` · GET/PUT/PATCH/DELETE `/shipments/{id}/` |

### Acciones personalizadas (custom actions)
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST | `/routes/{id}/stops/` | Paradas de una ruta |
| GET/PUT/PATCH/DELETE | `/routes/{id}/stops/{stop_id}/` | Parada específica |
| GET | `/warehouses/{id}/stock/` | Inventario de un almacén |
| PATCH | `/shipments/{id}/status/` | Cambiar estado del envío con validación de transiciones |

### Transiciones de estado válidas para `shipment`
```
pending → processing → in_transit → delivered
pending → cancelled
processing → cancelled
in_transit → returned
```

---

## Orden de implementación

Las apps deben implementarse en este orden para respetar las dependencias del schema.

| Fase | Apps | Dependencias |
|---|---|---|
| 1 | Setup base (DRF, JWT, spectacular, settings) | — |
| 2 | `suppliers`, `warehouses`, `customers` | Sin FKs a otras apps |
| 3 | `products` | `suppliers` |
| 4 | `warehouse_stock` (dentro de `warehouses`) | `products` + `warehouses` |
| 5 | `drivers` | `auth_user` |
| 6 | `transports` | `drivers` |
| 7 | `routes` + `route_stops` | `transports` + `warehouses` |
| 8 | `shipments` + `shipment_items` | Todo lo anterior |

---

## Autenticación y permisos

- **JWT**: access token (vida corta, 60 min) + refresh token (vida larga, 7 días).
- **Permiso base**: `IsAuthenticated` aplicado globalmente en settings.
- **Admin**: `IsAdminUser` para endpoints de creación/eliminación de `drivers` y `transports` (conductores y vehículos los gestiona el operador, no cualquier usuario).
- Los endpoints de `shipments` pueden ser accedidos por cualquier usuario autenticado en el MVP.

---

## Testing

Cada app tiene su carpeta `tests/` con dos archivos:

- `test_models.py` — validaciones, restricciones únicas, valores por defecto.
- `test_views.py` — usa `APITestCase`. Cubre: crear, listar, obtener, actualizar, eliminar y casos de error (400, 401, 404).

Patrón base para tests de vistas:

```python
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User

class SupplierViewSetTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_create_supplier(self):
        data = {'name': 'Tech Corp', 'email': 'a@b.com', 'city': 'Bogotá', 'country': 'Colombia'}
        response = self.client.post('/api/v1/suppliers/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

Ejecutar todos los tests:
```bash
python manage.py test
```

---

## Documentación automática

`drf-spectacular` genera el schema OpenAPI desde los ViewSets y Serializers sin configuración manual.

- Swagger UI: `GET /api/docs/`
- Schema JSON: `GET /api/schema/`

Decorar las acciones personalizadas con `@extend_schema` cuando el schema inferido no sea suficientemente descriptivo.

---

## Decisiones de diseño para el MVP

| Decisión | Elección MVP | Razón |
|---|---|---|
| Autenticación | JWT (simplejwt) | Stateless, estándar para APIs REST |
| ViewSet base | `ModelViewSet` | CRUD completo con mínimo código |
| Serializer base | `ModelSerializer` | Generación automática desde el modelo |
| Filtrado | `django-filter` + `SearchFilter` | Declarativo, sin lógica manual en vistas |
| Docs | `drf-spectacular` | Auto-generado, compatible con DRF 3.17+ |
| Paginación | `PageNumberPagination` | Suficiente para MVP, familiar para consumidores |
| Versionado | `/api/v1/` en URL | Permite migrar a v2 sin romper clientes existentes |
| Settings | Un solo `settings.py` con decouple | Evita complejidad innecesaria para MVP |
