# Spec: Fase 2 — `warehouses`

## Contexto

App Django independiente que gestiona los almacenes de la cadena logística. Un almacén es el punto de partida de los envíos y el lugar de almacenamiento de productos. No tiene FK hacia otras apps del proyecto, por lo que puede implementarse directamente después de la Fase 1.

La tabla resultante (`warehouses_warehouse`) será referenciada por `products`, `routes` y `shipments` en fases posteriores. Esta app debe quedar completamente funcional antes de avanzar a cualquiera de esas fases.

**Nota de arquitectura**: el proyecto actualmente tiene la app `products` en la raíz del proyecto (no bajo `apps/`). Para mantener coherencia, la app `warehouses` también se creará en la raíz del proyecto y se registrará como `'warehouses'` en `INSTALLED_APPS` — no como `'apps.warehouses'`. Si en el futuro se decide mover todo a `apps/`, ese refactor debe hacerse de forma consistente para todas las apps.

## Dependencias

- **Fase 1** completada: `config/settings.py` con `REST_FRAMEWORK`, JWT y migraciones iniciales aplicadas.
- No hay FK hacia otras apps del proyecto.

---

## Tareas

### T01 — Crear la app `warehouses`

- [ ] Ejecutar `python manage.py startapp warehouses` en la raíz del proyecto (mismo nivel que `products/` y `manage.py`)
- [ ] Verificar que se creó el directorio `warehouses/` con la estructura estándar de Django (`models.py`, `views.py`, `apps.py`, `tests.py`, `admin.py`, `migrations/`)

**Verificación**: el directorio `warehouses/` existe en la raíz del proyecto.

---

### T02 — `warehouses/apps.py`

- [ ] Abrir `warehouses/apps.py` generado por `startapp`
- [ ] Verificar que `name = 'warehouses'` (no `'apps.warehouses'`, la app vive en la raíz)
- [ ] Verificar que `default_auto_field = 'django.db.models.BigAutoField'`

El archivo debe quedar exactamente así:

```python
from django.apps import AppConfig


class WarehousesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'warehouses'
```

**Verificación**: `name` es `'warehouses'`.

---

### T03 — Registrar en `INSTALLED_APPS`

- [ ] Abrir `config/settings.py`
- [ ] Agregar `'warehouses'` a `INSTALLED_APPS`, después de las apps de terceros y antes de las futuras apps de negocio:

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
    'warehouses',   # ← agregar aquí
]
```

**Verificación**: `python manage.py check` no reporta errores relacionados con apps no registradas.

---

### T04 — `warehouses/models.py`

- [ ] Crear el modelo `Warehouse` con todos los campos del schema `warehouses_warehouse`:

| Campo | Tipo Django | Restricciones |
|---|---|---|
| `name` | `CharField(max_length=200)` | requerido |
| `code` | `CharField(max_length=20)` | `unique=True` |
| `address` | `TextField()` | requerido |
| `city` | `CharField(max_length=100)` | requerido |
| `state` | `CharField(max_length=100)` | requerido |
| `country` | `CharField(max_length=100)` | requerido |
| `latitude` | `DecimalField(max_digits=9, decimal_places=6)` | `null=True, blank=True` |
| `longitude` | `DecimalField(max_digits=9, decimal_places=6)` | `null=True, blank=True` |
| `capacity_m3` | `DecimalField(max_digits=10, decimal_places=2)` | requerido |
| `is_active` | `BooleanField(default=True)` | — |
| `created_at` | `DateTimeField(auto_now_add=True)` | automático |
| `updated_at` | `DateTimeField(auto_now=True)` | automático |

- [ ] Agregar clase `Meta` con:
  - `ordering = ['name']`
  - `verbose_name = 'warehouse'`
  - `verbose_name_plural = 'warehouses'`
- [ ] Agregar método `__str__` que retorne `f"{self.code} — {self.name}"`

**Verificación**: `python manage.py check` no reporta errores de modelos. `python manage.py makemigrations --check warehouses` detecta cambios pendientes (indica que el modelo está definido correctamente).

---

### T05 — `warehouses/serializers.py`

- [ ] Crear el archivo `warehouses/serializers.py` (no existe aún, `startapp` no lo genera)
- [ ] Crear `WarehouseSerializer` extendiendo `ModelSerializer`:
  - `Meta.model = Warehouse`
  - `Meta.fields = '__all__'` — incluye todos los campos del modelo
  - `Meta.read_only_fields = ['id', 'created_at', 'updated_at']`
- [ ] No se requieren validaciones custom en MVP — el campo `code` con `unique=True` es manejado automáticamente por DRF

**Verificación**: desde Django shell, importar `WarehouseSerializer` sin errores.

---

### T06 — `warehouses/services.py`

- [ ] Crear el archivo `warehouses/services.py` (no existe aún)
- [ ] El archivo debe contener la estructura base del módulo de servicios con comentario indicando que no hay lógica de negocio compleja en el MVP:

```python
# services.py — Warehouses
# En el MVP no hay lógica de negocio compleja para warehouses.
# Este archivo existe para mantener el patrón View → Service → Model
# y facilitar la adición de lógica futura (ej. cálculo de ocupación).
```

- [ ] No agregar funciones vacías ni placeholders — el archivo solo documenta la ausencia intencional de lógica

**Verificación**: el archivo existe en `warehouses/services.py`.

---

### T07 — `warehouses/views.py`

- [ ] Reemplazar el contenido generado por `startapp` en `warehouses/views.py`
- [ ] Crear `WarehouseViewSet` extendiendo `ModelViewSet`:
  - `queryset = Warehouse.objects.all()`
  - `serializer_class = WarehouseSerializer`
  - Sin permisos custom en MVP — hereda `DEFAULT_PERMISSION_CLASSES` de `REST_FRAMEWORK` (requiere autenticación JWT)
  - Sin acciones custom (`@action`) — CRUD estándar es suficiente para el MVP
- [ ] No agregar lógica de negocio en la vista — delegar al service si se necesita en el futuro

**Verificación**: desde Django shell, importar `WarehouseViewSet` sin errores.

---

### T08 — `warehouses/urls.py`

- [ ] Crear el archivo `warehouses/urls.py` (no existe aún, `startapp` no lo genera)
- [ ] Registrar `WarehouseViewSet` usando `DefaultRouter` de DRF con el prefix `warehouses`:

```python
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet)

urlpatterns = router.urls
```

**Verificación**: el archivo existe y se puede importar sin errores.

---

### T09 — Incluir en `config/urls.py`

- [ ] Abrir `config/urls.py`
- [ ] Agregar el `include` de `warehouses.urls` bajo el prefijo `/api/v1/`:

```python
path('api/v1/', include('warehouses.urls')),
```

- [ ] El bloque de URLs JWT existente debe mantenerse intacto; solo agregar la nueva línea

Resultado esperado en `config/urls.py`:

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
]
```

**Verificación**: `python manage.py check` no reporta errores de URL.

---

### T10 — Crear y aplicar migraciones

- [ ] Ejecutar `python manage.py makemigrations warehouses`
  - Debe generar `warehouses/migrations/0001_initial.py`
  - Verificar que el archivo generado incluye todos los campos: `name`, `code`, `address`, `city`, `state`, `country`, `latitude`, `longitude`, `capacity_m3`, `is_active`, `created_at`, `updated_at`
- [ ] Ejecutar `python manage.py migrate`
  - Debe aplicar `warehouses.0001_initial` sin errores

**Verificación**: `python manage.py migrate --check` retorna sin pendientes. La tabla `warehouses_warehouse` existe en `db.sqlite3`.

---

### T11 — Verificación integral de la Fase 2

- [ ] `python manage.py check` retorna "System check identified no issues"
- [ ] `python manage.py migrate --check` retorna sin pendientes
- [ ] Desde Django shell: `from warehouses.models import Warehouse; print(Warehouse._meta.fields)` muestra todos los campos esperados
- [ ] Desde Django shell: `from warehouses.serializers import WarehouseSerializer; print(WarehouseSerializer().fields.keys())` muestra todos los campos
- [ ] Con el servidor activo (iniciado manualmente por el usuario): `GET /api/v1/warehouses/` retorna `401` sin token JWT y `200` con token válido

---

## Endpoints resultantes

| Método | URL | Descripción | Body requerido |
|---|---|---|---|
| GET | `/api/v1/warehouses/` | Listar todos los almacenes (paginado) | — |
| POST | `/api/v1/warehouses/` | Crear un almacén nuevo | Ver campos requeridos |
| GET | `/api/v1/warehouses/{id}/` | Obtener un almacén por ID | — |
| PUT | `/api/v1/warehouses/{id}/` | Actualizar todos los campos | Ver campos requeridos |
| PATCH | `/api/v1/warehouses/{id}/` | Actualizar campos parcialmente | Campos a modificar |
| DELETE | `/api/v1/warehouses/{id}/` | Eliminar un almacén | — |

Todos los endpoints requieren header:
```
Authorization: Bearer <access_token>
```

**Ejemplo de body para POST/PUT:**
```json
{
  "name": "Almacén Central Lima",
  "code": "LIM-001",
  "address": "Av. Industriales 1234",
  "city": "Lima",
  "state": "Lima",
  "country": "Perú",
  "latitude": -12.046374,
  "longitude": -77.042793,
  "capacity_m3": "5000.00",
  "is_active": true
}
```

**Ejemplo de respuesta exitosa (201 Created):**
```json
{
  "id": 1,
  "name": "Almacén Central Lima",
  "code": "LIM-001",
  "address": "Av. Industriales 1234",
  "city": "Lima",
  "state": "Lima",
  "country": "Perú",
  "latitude": "-12.046374",
  "longitude": "-77.042793",
  "capacity_m3": "5000.00",
  "is_active": true,
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T10:00:00Z"
}
```

---

## Validaciones de negocio

En el MVP no hay lógica de negocio compleja para almacenes. Las únicas validaciones son las impuestas por el modelo y DRF:

- `code` debe ser único — DRF retorna `400` con `{"code": ["warehouse with this code already exists."]}` si se intenta duplicar
- `name`, `address`, `city`, `state`, `country`, `capacity_m3` son requeridos — DRF retorna `400` con mensaje por campo si se omiten
- `latitude` y `longitude` son opcionales (`null=True, blank=True`) — se pueden omitir o enviar `null`
- `capacity_m3` debe ser un número decimal válido con hasta 10 dígitos y 2 decimales
- `latitude` acepta hasta 9 dígitos con 6 decimales (rango válido: -90.000000 a 90.000000)
- `longitude` acepta hasta 9 dígitos con 6 decimales (rango válido: -180.000000 a 180.000000)

---

## Notas al Implement Agent

1. **La app vive en la raíz del proyecto**, no bajo `apps/`. Registrar como `'warehouses'` en `INSTALLED_APPS`, no como `'apps.warehouses'`. Esto es coherente con la app `products` existente.

2. **`serializers.py` y `urls.py` no los genera `startapp`**: deben crearse manualmente. No omitirlos.

3. **`services.py` no debe estar vacío ni tener funciones placeholder**: el archivo debe contener únicamente el comentario explicativo definido en T06. No crear funciones `pass` ni clases vacías — agrega ruido sin valor.

4. **`latitude` y `longitude` son `null=True, blank=True`**: al definir el campo en el modelo, ambas opciones son necesarias — `null=True` para la base de datos y `blank=True` para que DRF no los exija en la validación de formularios.

5. **`created_at` y `updated_at` son `read_only_fields` en el serializer**: nunca deben ser enviados por el cliente ni aceptados como input. DRF los maneja automáticamente con `auto_now_add` y `auto_now`.

6. **`DefaultRouter` genera automáticamente los 6 endpoints estándar** (list, create, retrieve, update, partial_update, destroy) — no hace falta declararlos manualmente.

7. **La paginación hereda de `REST_FRAMEWORK['DEFAULT_PAGINATION_CLASS']`** configurada en la Fase 1 (`PageNumberPagination`, `PAGE_SIZE=20`). No es necesario configurarla en el ViewSet.

8. **El campo `code` con `unique=True` en el modelo** produce automáticamente la validación de unicidad en DRF — no es necesario agregar `UniqueValidator` en el serializer.

9. **Fase 1 debe estar completa antes de ejecutar T10**: si las migraciones iniciales no se aplicaron, `python manage.py migrate` puede fallar. Verificar que `django_migrations` ya existe en `db.sqlite3`.

10. **Esta app será referenciada como FK en Fases 7 (`products`) y 8 (`routes`)**: no renombrar ni mover el modelo `Warehouse` después de crear la primera migración sin hacer una migración de renombrado.
