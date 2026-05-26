# Arquitectura de desarrollo — Logistics API MVP

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Django 6 + Django REST Framework 3.17 |
| Base de datos | SQLite (desarrollo) / PostgreSQL (producción) |
| Autenticación | DRF Token Authentication |
| Variables de entorno | python-decouple |
| ORM | Django ORM |

---

## Patrón por capa

Cada app sigue el patrón **View → Service → Model**. Las vistas no contienen lógica de negocio; los modelos no contienen lógica de negocio compleja. La capa `services.py` es el único lugar donde vive la lógica del dominio.

```
Request
   ↓
urls.py          → mapea la URL al ViewSet
   ↓
views.py         → valida HTTP, delega al service, devuelve Response
   ↓
serializers.py   → valida y transforma datos de entrada/salida
   ↓
services.py      → lógica de negocio (cálculos, transiciones de estado, stock)
   ↓
models.py        → queries, restricciones de DB
   ↓
Response
```

### Responsabilidades por archivo

| Archivo | Responsabilidad | No debe contener |
|---|---|---|
| `models.py` | Definición de campos, `Meta`, métodos de instancia simples | Lógica de negocio compleja |
| `serializers.py` | Validación de input, transformación input→output, nested reads | Queries directas a DB |
| `services.py` | Lógica de negocio, transiciones de estado, cálculos de costo, actualización de stock | Lógica HTTP |
| `views.py` | Manejo HTTP, permisos, llamada al service | Lógica de negocio |
| `urls.py` | Registro de rutas con `router` | — |

---

## Estructura de archivos por app

```
apps/<app>/
├── __init__.py
├── apps.py            ← name = 'apps.<app>'
├── models.py
├── serializers.py
├── services.py        ← lógica de negocio
├── views.py
├── urls.py
└── tests/
    ├── __init__.py
    ├── test_models.py
    ├── test_serializers.py
    └── test_views.py
```

---

## Autenticación

**DRF Token Authentication** para el MVP. Token almacenado en `authtoken_token` (tabla generada por DRF).

```
POST /api/v1/auth/login/    → { token }   ← obtener token
POST /api/v1/auth/logout/   → 204         ← invalidar token
```

Todas las rutas de negocio requieren header:
```
Authorization: Token <token>
```

Roles manejados con `auth_group`:

| Grupo | Acceso |
|---|---|
| `admin` | CRUD completo en todos los módulos |
| `operator` | CRUD en shipments, lectura en el resto |
| `driver` | Lectura de sus envíos asignados, actualización de estado |
| `customer` | CRUD en sus propios envíos |

---

## Endpoints — convención de URLs

Base: `/api/v1/`

| Módulo | URL | Métodos |
|---|---|---|
| Autenticación | `/api/v1/auth/login/` | POST |
| Clientes | `/api/v1/customers/` | GET, POST, PUT, PATCH, DELETE |
| Proveedores | `/api/v1/suppliers/` | GET, POST, PUT, PATCH, DELETE |
| Almacenes | `/api/v1/warehouses/` | GET, POST, PUT, PATCH, DELETE |
| Productos | `/api/v1/products/` | GET, POST, PUT, PATCH, DELETE |
| Transportes | `/api/v1/transports/` | GET, POST, PUT, PATCH, DELETE |
| Conductores | `/api/v1/drivers/` | GET, POST, PUT, PATCH, DELETE |
| Rutas | `/api/v1/routes/` | GET, POST, PUT, PATCH, DELETE |
| Envíos | `/api/v1/shipments/` | GET, POST, PUT, PATCH, DELETE |
| Cambio de estado | `/api/v1/shipments/{id}/update-status/` | POST |

Usar `DefaultRouter` de DRF en cada `urls.py` para registrar los `ModelViewSet`.

---

## Lógica de negocio crítica (services.py)

### `shipments/services.py`
- `calculate_shipment_cost(shipment)` — costo base por peso + recargo por tipo de transporte
- `assign_transport(shipment, transport, driver)` — valida disponibilidad, actualiza estados
- `update_shipment_status(shipment, new_status)` — valida transición válida, actualiza `delivered_at` si aplica
- `create_shipment(data)` — genera `tracking_number`, descuenta stock de productos, calcula costo

### Transiciones de estado válidas

```
PENDING → PICKED_UP → IN_TRANSIT → DELIVERED
PENDING → CANCELLED
IN_TRANSIT → RETURNED
```

Cualquier otra transición debe lanzar `ValidationError`.

### `products/services.py`
- `update_stock(product, quantity, operation)` — incrementa o decrementa stock con validación de mínimo 0

---

## Configuración de Django

`config/settings.py` con variables via `python-decouple`:

```python
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', cast=bool, default=False)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        ...
    }
}
INSTALLED_APPS = [
    # Django built-in
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Terceros
    'rest_framework',
    'rest_framework.authtoken',
    # Apps del proyecto
    'apps.customers',
    'apps.suppliers',
    'apps.warehouses',
    'apps.products',
    'apps.transports',
    'apps.drivers',
    'apps.routes',
    'apps.shipments',
]
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

---

## Orden de desarrollo (por dependencias)

El orden respeta las FK del schema para no bloquear migraciones.

| Fase | App | Dependencias en DB |
|---|---|---|
| 1 | `config` inicial | — Configurar Django + DRF + auth + `.env` |
| 2 | `warehouses` | Sin FK externas |
| 3 | `suppliers` | Sin FK externas |
| 4 | `customers` | `auth_user` (built-in) |
| 5 | `drivers` | `auth_user` (built-in) |
| 6 | `transports` | Sin FK externas |
| 7 | `products` | `warehouses`, `suppliers` |
| 8 | `routes` | `warehouses` |
| 9 | `shipments` | Todos los módulos anteriores |

---

## Convenciones de respuesta

**Éxito:**
```json
{ "id": 1, "tracking_number": "LOG-0001", ... }
```

**Error de validación (400):**
```json
{ "field_name": ["mensaje de error"] }
```

**Error de negocio (400):**
```json
{ "detail": "No se puede transicionar de IN_TRANSIT a PENDING." }
```

**No autenticado (401):**
```json
{ "detail": "Authentication credentials were not provided." }
```

---

## Formato del archivo `.env`

```ini
SECRET_KEY=cambiar-en-produccion
DEBUG=True
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```
