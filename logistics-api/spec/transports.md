# Spec: Fase 6 — `transports`

## Contexto

App Django independiente que gestiona los vehículos utilizados para entregar productos. Un transporte tiene un tipo (camión, furgoneta, moto, bici), una capacidad de carga y un estado operativo. **No tiene FK hacia otras apps del proyecto**, por lo que puede implementarse en cualquier momento después de la Fase 1.

La tabla resultante (`transports_transport`) será referenciada como FK nullable en `shipments_shipment` (Fase 9). Esta app debe quedar completamente funcional antes de avanzar a esa fase.

**Nota de arquitectura**: la app vive en la raíz del proyecto (mismo nivel que `drivers/`, `customers/`, `warehouses/`, `suppliers/` y `manage.py`), no bajo `apps/`. Se registra como `'transports'` en `INSTALLED_APPS`, coherente con el patrón de todas las fases anteriores.

**Sin endpoint especial de registro**: a diferencia de `customers` y `drivers`, `transports` no extiende `auth_user`. El CRUD completo es estándar y todos sus endpoints requieren autenticación JWT.

## Dependencias

- **Fase 1** completada: `config/settings.py` con `REST_FRAMEWORK`, JWT configurado, migraciones iniciales aplicadas.
- No depende de `warehouses`, `suppliers`, `customers`, `drivers`, `products`, `routes` ni `shipments`.

---

## Tareas

### T01 — Crear la app `transports`

- [ ] Ejecutar `python manage.py startapp transports` en la raíz del proyecto (mismo nivel que `drivers/`, `products/`, `warehouses/`, `suppliers/`, `customers/` y `manage.py`)
- [ ] Verificar que se creó el directorio `transports/` con la estructura estándar de Django: `models.py`, `views.py`, `apps.py`, `tests.py`, `admin.py`, `migrations/`

**Verificación**: el directorio `transports/` existe en la raíz del proyecto.

---

### T02 — `transports/apps.py`

- [ ] Abrir `transports/apps.py` generado por `startapp`
- [ ] Verificar que `name = 'transports'` (no `'apps.transports'`, la app vive en la raíz)
- [ ] Verificar que `default_auto_field = 'django.db.models.BigAutoField'`

El archivo debe quedar exactamente así:

```python
from django.apps import AppConfig


class TransportsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'transports'
```

**Verificación**: `name` es `'transports'`.

---

### T03 — Registrar en `INSTALLED_APPS`

- [ ] Abrir `config/settings.py`
- [ ] Agregar `'transports'` a `INSTALLED_APPS`, después de `'drivers'` y antes de cualquier app que dependa de ella:

```python
INSTALLED_APPS = [
    # Django built-in
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Terceros
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    # Apps del proyecto
    'products',
    'warehouses',
    'suppliers',
    'customers',
    'drivers',
    'transports',   # ← agregar aquí
]
```

**Verificación**: `python manage.py check` no reporta errores relacionados con apps no registradas.

---

### T04 — `transports/models.py`

- [ ] Importar `models` de `django.db`
- [ ] Definir la clase interna `VehicleType` como `models.TextChoices` con los valores exactos del schema:

| Valor DB | Label |
|---|---|
| `'TRUCK'` | `'Truck'` |
| `'VAN'` | `'Van'` |
| `'MOTORCYCLE'` | `'Motorcycle'` |
| `'BIKE'` | `'Bike'` |

- [ ] Definir la clase interna `Status` como `models.TextChoices` con los valores exactos del schema:

| Valor DB | Label |
|---|---|
| `'AVAILABLE'` | `'Available'` |
| `'IN_ROUTE'` | `'In Route'` |
| `'MAINTENANCE'` | `'Maintenance'` |
| `'INACTIVE'` | `'Inactive'` |

- [ ] Crear el modelo `Transport` con todos los campos del schema `transports_transport`:

| Campo | Tipo Django | Restricciones |
|---|---|---|
| `license_plate` | `CharField(max_length=20)` | `unique=True` |
| `type` | `CharField(max_length=20, choices=VehicleType.choices)` | requerido |
| `brand` | `CharField(max_length=100)` | requerido |
| `model` | `CharField(max_length=100)` | requerido |
| `year` | `SmallIntegerField()` | requerido |
| `capacity_kg` | `DecimalField(max_digits=8, decimal_places=2)` | requerido |
| `capacity_m3` | `DecimalField(max_digits=8, decimal_places=2)` | requerido |
| `status` | `CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)` | requerido, default `AVAILABLE` |
| `created_at` | `DateTimeField(auto_now_add=True)` | automático |
| `updated_at` | `DateTimeField(auto_now=True)` | automático |

- [ ] Agregar clase `Meta` con:
  - `ordering = ['license_plate']`
  - `verbose_name = 'transport'`
  - `verbose_name_plural = 'transports'`
- [ ] Agregar método `__str__` que retorne `f"{self.license_plate} — {self.brand} {self.model} ({self.year})"`

**Nota de nombres**: el campo `type` es una palabra reservada de Python; Django lo maneja sin problema como nombre de campo en el ORM, pero en el shell deberá accederse como `transport.type`, no `type(transport)`. El campo `model` coincide con el nombre de la clase base de Django (`models.Model`); al ser un campo de instancia, no hay colisión real, pero hay que tener precaución al referenciarse desde código de introspección.

**Verificación**: `python manage.py check` no reporta errores de modelos. `python manage.py makemigrations --check transports` detecta cambios pendientes (indica que el modelo está definido correctamente).

---

### T05 — `transports/serializers.py`

- [ ] Crear el archivo `transports/serializers.py` (no existe aún, `startapp` no lo genera)
- [ ] Crear `TransportSerializer` extendiendo `ModelSerializer`:
  - `Meta.model = Transport`
  - `Meta.fields = '__all__'` — incluye todos los campos del modelo
  - `Meta.read_only_fields = ['id', 'created_at', 'updated_at']`
- [ ] No se requieren validaciones custom en MVP:
  - El campo `license_plate` con `unique=True` es manejado automáticamente por DRF
  - Los campos `type` y `status` con `choices` son validados automáticamente por DRF a través del `CharField` con choices

**Verificación**: desde Django shell, importar `TransportSerializer` sin errores. Instanciar con datos válidos y confirmar que `is_valid()` funciona.

---

### T06 — `transports/services.py`

- [ ] Crear el archivo `transports/services.py` (no existe aún)
- [ ] El archivo debe contener la estructura base del módulo de servicios con comentario indicando que no hay lógica de negocio compleja en el MVP:

```python
# services.py — Transports
# En el MVP no hay lógica de negocio compleja para transports.
# Este archivo existe para mantener el patrón View → Service → Model
# y facilitar la adición de lógica futura (ej. validar disponibilidad
# antes de asignar un transporte a un envío, calcular recargos por tipo).
```

- [ ] No agregar funciones vacías ni placeholders — el archivo solo documenta la ausencia intencional de lógica

**Verificación**: el archivo existe en `transports/services.py`.

---

### T07 — `transports/views.py`

- [ ] Reemplazar el contenido generado por `startapp` en `transports/views.py`
- [ ] Importar: `ModelViewSet` de `rest_framework.viewsets`, `Transport` del modelo local, `TransportSerializer` de los serializers locales
- [ ] Crear `TransportViewSet` extendiendo `ModelViewSet`:
  - `queryset = Transport.objects.all()`
  - `serializer_class = TransportSerializer`
  - Sin permisos custom en MVP — hereda `DEFAULT_PERMISSION_CLASSES` de `REST_FRAMEWORK` (requiere autenticación JWT)
  - Sin acciones custom (`@action`) — CRUD estándar es suficiente para el MVP
- [ ] No agregar lógica de negocio en la vista — delegar al service si se necesita en el futuro

**Verificación**: desde Django shell, importar `TransportViewSet` sin errores.

---

### T08 — `transports/urls.py`

- [ ] Crear el archivo `transports/urls.py` (no existe aún, `startapp` no lo genera)
- [ ] Registrar `TransportViewSet` usando `DefaultRouter` de DRF con el prefix `transports`:

```python
from rest_framework.routers import DefaultRouter
from .views import TransportViewSet

router = DefaultRouter()
router.register(r'transports', TransportViewSet)

urlpatterns = router.urls
```

**Verificación**: el archivo existe y se puede importar sin errores.

---

### T09 — Incluir en `config/urls.py`

- [ ] Abrir `config/urls.py`
- [ ] Agregar el `include` de `transports.urls` bajo el prefijo `/api/v1/`, después del include de `drivers.urls`:

```python
path('api/v1/', include('transports.urls')),
```

El archivo `config/urls.py` resultante debe quedar así:

```python
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('api/v1/', include('warehouses.urls')),
    path('api/v1/', include('suppliers.urls')),
    path('api/v1/', include('customers.urls')),
    path('api/v1/', include('drivers.urls')),
    path('api/v1/', include('transports.urls')),
]
```

**Verificación**: `python manage.py check` no reporta errores de URL.

---

### T10 — Crear y aplicar migraciones

- [ ] Ejecutar `python manage.py makemigrations transports`
  - Debe generar `transports/migrations/0001_initial.py`
  - Verificar que el archivo generado incluye todos los campos: `license_plate (unique)`, `type (choices)`, `brand`, `model`, `year`, `capacity_kg`, `capacity_m3`, `status (choices, default=AVAILABLE)`, `created_at`, `updated_at`
- [ ] Ejecutar `python manage.py migrate`
  - Debe aplicar `transports.0001_initial` sin errores

**Verificación**: `python manage.py migrate --check` retorna sin pendientes. La tabla `transports_transport` existe en `db.sqlite3`.

---

### T11 — Verificación integral de la Fase 6

- [ ] `python manage.py check` retorna "System check identified no issues"
- [ ] `python manage.py migrate --check` retorna sin pendientes
- [ ] Desde Django shell: `from transports.models import Transport; print(Transport._meta.fields)` muestra todos los campos esperados
- [ ] Desde Django shell: `print([c[0] for c in Transport.VehicleType.choices])` retorna `['TRUCK', 'VAN', 'MOTORCYCLE', 'BIKE']`
- [ ] Desde Django shell: `print([c[0] for c in Transport.Status.choices])` retorna `['AVAILABLE', 'IN_ROUTE', 'MAINTENANCE', 'INACTIVE']`
- [ ] Desde Django shell: `from transports.serializers import TransportSerializer; print(list(TransportSerializer().fields.keys()))` muestra `id`, `license_plate`, `type`, `brand`, `model`, `year`, `capacity_kg`, `capacity_m3`, `status`, `created_at`, `updated_at`
- [ ] Con el servidor activo (iniciado manualmente por el usuario):
  - `GET /api/v1/transports/` sin token retorna `401`
  - `GET /api/v1/transports/` con token JWT válido retorna `200`

---

## Endpoints resultantes

| Método | URL | Auth requerida | Descripción |
|---|---|---|---|
| GET | `/api/v1/transports/` | Sí (JWT Bearer) | Listar todos los transportes (paginado) |
| POST | `/api/v1/transports/` | Sí (JWT Bearer) | Registrar un transporte nuevo |
| GET | `/api/v1/transports/{id}/` | Sí (JWT Bearer) | Obtener un transporte por ID |
| PUT | `/api/v1/transports/{id}/` | Sí (JWT Bearer) | Actualizar todos los campos |
| PATCH | `/api/v1/transports/{id}/` | Sí (JWT Bearer) | Actualizar campos parcialmente |
| DELETE | `/api/v1/transports/{id}/` | Sí (JWT Bearer) | Eliminar un transporte |

Todos los endpoints requieren header:
```
Authorization: Bearer <access_token>
```

**Ejemplo de body para POST/PUT:**
```json
{
  "license_plate": "ABC-123",
  "type": "TRUCK",
  "brand": "Volvo",
  "model": "FH16",
  "year": 2022,
  "capacity_kg": "18000.00",
  "capacity_m3": "90.00",
  "status": "AVAILABLE"
}
```

**Ejemplo de respuesta exitosa (201 Created):**
```json
{
  "id": 1,
  "license_plate": "ABC-123",
  "type": "TRUCK",
  "brand": "Volvo",
  "model": "FH16",
  "year": 2022,
  "capacity_kg": "18000.00",
  "capacity_m3": "90.00",
  "status": "AVAILABLE",
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T10:00:00Z"
}
```

---

## Validaciones de negocio

En el MVP no hay lógica de negocio compleja para transportes. Las únicas validaciones son las impuestas por el modelo y DRF:

- `license_plate` debe ser único — DRF retorna `400` con `{"license_plate": ["transport with this license plate already exists."]}` si se intenta duplicar
- `type` debe ser uno de `TRUCK`, `VAN`, `MOTORCYCLE`, `BIKE` — DRF retorna `400` si el valor no está en los choices
- `status` debe ser uno de `AVAILABLE`, `IN_ROUTE`, `MAINTENANCE`, `INACTIVE` — DRF retorna `400` si el valor no está en los choices; si no se envía al crear, el default es `AVAILABLE`
- `brand`, `model`, `license_plate` son requeridos — DRF retorna `400` con mensaje por campo si se omiten
- `year` es `SmallIntegerField` — DRF retorna `400` si el valor no es un entero
- `capacity_kg` y `capacity_m3` deben ser decimales válidos con hasta 8 dígitos y 2 decimales — DRF retorna `400` si el valor no cumple

---

## Notas al Implement Agent

1. **La app vive en la raíz del proyecto**, no bajo `apps/`. Registrar como `'transports'` en `INSTALLED_APPS`, no como `'apps.transports'`.

2. **`serializers.py` y `urls.py` no los genera `startapp`**: deben crearse manualmente. No omitirlos.

3. **`services.py` no debe estar vacío ni tener funciones placeholder**: el archivo debe contener únicamente el comentario explicativo definido en T06. No crear funciones `pass` ni clases vacías — agrega ruido sin valor.

4. **`VehicleType` y `Status` como clases internas de `Transport`**: definir ambas `TextChoices` dentro de la clase del modelo para facilitar las referencias `Transport.VehicleType.choices` y `Transport.Status.AVAILABLE` desde serializers y services sin crear importaciones circulares.

5. **El campo `type` del modelo**: aunque `type` es una función built-in de Python, Django lo acepta sin problema como nombre de atributo de instancia. No renombrar a `vehicle_type` ni `transport_type` — el schema de base de datos define la columna como `type` y así debe quedar en el modelo para que Django genere `transports_transport.type`.

6. **El campo `model` del modelo**: `model` es también el nombre de la clase base de Django (`models.Model`), pero como atributo de instancia del modelo `Transport` no hay colisión real. No renombrar — el schema define la columna como `model`.

7. **`status` con default `AVAILABLE`**: el campo `status` en el modelo usa `default=Status.AVAILABLE`. Al enviar un `POST` sin el campo `status`, Django usará ese default y DRF lo incluirá en la respuesta.

8. **`year` es `SmallIntegerField`**: rango válido -32768 a 32767. Para años de fabricación de vehículos (ej. 1990–2030) es más que suficiente. No usar `IntegerField` — el schema especifica `smallint`.

9. **`capacity_kg` y `capacity_m3` son `DecimalField(max_digits=8, decimal_places=2)`**: el cliente debe enviarlos como strings numéricos en el JSON (ej. `"18000.00"`). DRF los deserializa correctamente.

10. **`DefaultRouter` genera automáticamente los 6 endpoints estándar** (list, create, retrieve, update, partial_update, destroy) — no hace falta declararlos manualmente.

11. **La paginación hereda de `REST_FRAMEWORK['DEFAULT_PAGINATION_CLASS']`** configurada en la Fase 1 (`PageNumberPagination`, `PAGE_SIZE=20`). No es necesario configurarla en el ViewSet.

12. **El campo `license_plate` con `unique=True` en el modelo** produce automáticamente la validación de unicidad en DRF — no es necesario agregar `UniqueValidator` en el serializer.

13. **Esta app será referenciada como FK nullable en la Fase 9 (`shipments`)**: no renombrar ni mover el modelo `Transport` después de crear la primera migración sin hacer una migración de renombrado.

14. **No hay endpoint público en esta app**: a diferencia de `customers` y `drivers`, los transportes son gestionados por administradores u operadores. Todos los endpoints heredan `IsAuthenticated` de `DEFAULT_PERMISSION_CLASSES` — no sobreescribir `permission_classes` en el ViewSet.
