# Spec: Fase 3 — `suppliers`

## Contexto

App Django independiente que gestiona los proveedores de productos tecnológicos. Un proveedor es la empresa que vende los productos que luego se almacenan y envían. No tiene FK hacia otras apps del proyecto, por lo que puede implementarse en paralelo con la Fase 2 (`warehouses`) una vez completada la Fase 1.

La tabla resultante (`suppliers_supplier`) será referenciada por `products` en la Fase 7. Esta app debe quedar completamente funcional antes de avanzar a esa fase.

**Nota de arquitectura**: la app vive en la raíz del proyecto (mismo nivel que `products/`, `warehouses/` y `manage.py`), no bajo `apps/`. Se registra como `'suppliers'` en `INSTALLED_APPS`, coherente con el patrón establecido en las fases anteriores.

## Dependencias

- **Fase 1** completada: `config/settings.py` con `REST_FRAMEWORK`, JWT y migraciones iniciales aplicadas.
- **Fase 2** (`warehouses`) no es requisito para esta fase — no hay FK entre `suppliers` y `warehouses`.
- No hay FK hacia otras apps del proyecto.

---

## Tareas

### T01 — Crear la app `suppliers`

- [ ] Ejecutar `python manage.py startapp suppliers` en la raíz del proyecto (mismo nivel que `products/`, `warehouses/` y `manage.py`)
- [ ] Verificar que se creó el directorio `suppliers/` con la estructura estándar de Django: `models.py`, `views.py`, `apps.py`, `tests.py`, `admin.py`, `migrations/`

**Verificación**: el directorio `suppliers/` existe en la raíz del proyecto.

---

### T02 — `suppliers/apps.py`

- [ ] Abrir `suppliers/apps.py` generado por `startapp`
- [ ] Verificar que `name = 'suppliers'` (no `'apps.suppliers'` — la app vive en la raíz)
- [ ] Verificar que `default_auto_field = 'django.db.models.BigAutoField'`

El archivo debe quedar exactamente así:

```python
from django.apps import AppConfig


class SuppliersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'suppliers'
```

**Verificación**: `name` es `'suppliers'`.

---

### T03 — Registrar en `INSTALLED_APPS`

- [ ] Abrir `config/settings.py`
- [ ] Agregar `'suppliers'` a `INSTALLED_APPS`, junto a las demás apps de negocio del proyecto:

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
    'suppliers',   # ← agregar aquí
]
```

**Verificación**: `python manage.py check` no reporta errores relacionados con apps no registradas.

---

### T04 — `suppliers/models.py`

- [ ] Crear el modelo `Supplier` con todos los campos del schema `suppliers_supplier`:

| Campo | Tipo Django | Restricciones |
|---|---|---|
| `name` | `CharField(max_length=200)` | requerido |
| `tax_id` | `CharField(max_length=20)` | `unique=True` |
| `contact_name` | `CharField(max_length=200)` | requerido |
| `email` | `CharField(max_length=254)` | requerido |
| `phone` | `CharField(max_length=20)` | requerido |
| `address` | `TextField()` | requerido |
| `city` | `CharField(max_length=100)` | requerido |
| `country` | `CharField(max_length=100)` | requerido |
| `is_active` | `BooleanField(default=True)` | — |
| `created_at` | `DateTimeField(auto_now_add=True)` | automático |
| `updated_at` | `DateTimeField(auto_now=True)` | automático |

- [ ] Agregar clase `Meta` con:
  - `ordering = ['name']`
  - `verbose_name = 'supplier'`
  - `verbose_name_plural = 'suppliers'`
- [ ] Agregar método `__str__` que retorne `f"{self.tax_id} — {self.name}"`

**Verificación**: `python manage.py check` no reporta errores de modelos. `python manage.py makemigrations --check suppliers` detecta cambios pendientes (indica que el modelo está definido correctamente).

---

### T05 — `suppliers/serializers.py`

- [ ] Crear el archivo `suppliers/serializers.py` (no existe aún — `startapp` no lo genera)
- [ ] Crear `SupplierSerializer` extendiendo `ModelSerializer`:
  - `Meta.model = Supplier`
  - `Meta.fields = '__all__'` — incluye todos los campos del modelo
  - `Meta.read_only_fields = ['id', 'created_at', 'updated_at']`
- [ ] No se requieren validaciones custom en MVP — el campo `tax_id` con `unique=True` es manejado automáticamente por DRF

**Verificación**: desde Django shell, importar `SupplierSerializer` sin errores.

---

### T06 — `suppliers/services.py`

- [ ] Crear el archivo `suppliers/services.py` (no existe aún — `startapp` no lo genera)
- [ ] El archivo debe contener la estructura base del módulo de servicios con comentario indicando que no hay lógica de negocio compleja en el MVP:

```python
# services.py — Suppliers
# En el MVP no hay lógica de negocio compleja para suppliers.
# Este archivo existe para mantener el patrón View → Service → Model
# y facilitar la adición de lógica futura (ej. validación de proveedor activo al crear producto).
```

- [ ] No agregar funciones vacías ni placeholders — el archivo solo documenta la ausencia intencional de lógica

**Verificación**: el archivo existe en `suppliers/services.py`.

---

### T07 — `suppliers/views.py`

- [ ] Reemplazar el contenido generado por `startapp` en `suppliers/views.py`
- [ ] Crear `SupplierViewSet` extendiendo `ModelViewSet`:
  - `queryset = Supplier.objects.all()`
  - `serializer_class = SupplierSerializer`
  - Sin permisos custom en MVP — hereda `DEFAULT_PERMISSION_CLASSES` de `REST_FRAMEWORK` (requiere autenticación JWT)
  - Sin acciones custom (`@action`) — CRUD estándar es suficiente para el MVP
- [ ] No agregar lógica de negocio en la vista — delegar al service si se necesita en el futuro

**Verificación**: desde Django shell, importar `SupplierViewSet` sin errores.

---

### T08 — `suppliers/urls.py`

- [ ] Crear el archivo `suppliers/urls.py` (no existe aún — `startapp` no lo genera)
- [ ] Registrar `SupplierViewSet` usando `DefaultRouter` de DRF con el prefix `suppliers`:

```python
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)

urlpatterns = router.urls
```

**Verificación**: el archivo existe y se puede importar sin errores.

---

### T09 — Incluir en `config/urls.py`

- [ ] Abrir `config/urls.py`
- [ ] Agregar el `include` de `suppliers.urls` bajo el prefijo `/api/v1/`, junto a la línea de `warehouses.urls` ya existente:

```python
path('api/v1/', include('suppliers.urls')),
```

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
    path('api/v1/', include('suppliers.urls')),
]
```

**Verificación**: `python manage.py check` no reporta errores de URL.

---

### T10 — Crear y aplicar migraciones

- [ ] Ejecutar `python manage.py makemigrations suppliers`
  - Debe generar `suppliers/migrations/0001_initial.py`
  - Verificar que el archivo generado incluye todos los campos: `name`, `tax_id`, `contact_name`, `email`, `phone`, `address`, `city`, `country`, `is_active`, `created_at`, `updated_at`
- [ ] Ejecutar `python manage.py migrate`
  - Debe aplicar `suppliers.0001_initial` sin errores

**Verificación**: `python manage.py migrate --check` retorna sin pendientes. La tabla `suppliers_supplier` existe en `db.sqlite3`.

---

### T11 — Verificación integral de la Fase 3

- [ ] `python manage.py check` retorna "System check identified no issues"
- [ ] `python manage.py migrate --check` retorna sin pendientes
- [ ] Desde Django shell: `from suppliers.models import Supplier; print(Supplier._meta.fields)` muestra todos los campos esperados
- [ ] Desde Django shell: `from suppliers.serializers import SupplierSerializer; print(SupplierSerializer().fields.keys())` muestra todos los campos
- [ ] Con el servidor activo (iniciado manualmente por el usuario): `GET /api/v1/suppliers/` retorna `401` sin token JWT y `200` con token válido

---

## Endpoints resultantes

| Método | URL | Descripción | Body requerido |
|---|---|---|---|
| GET | `/api/v1/suppliers/` | Listar todos los proveedores (paginado) | — |
| POST | `/api/v1/suppliers/` | Crear un proveedor nuevo | Ver campos requeridos |
| GET | `/api/v1/suppliers/{id}/` | Obtener un proveedor por ID | — |
| PUT | `/api/v1/suppliers/{id}/` | Actualizar todos los campos | Ver campos requeridos |
| PATCH | `/api/v1/suppliers/{id}/` | Actualizar campos parcialmente | Campos a modificar |
| DELETE | `/api/v1/suppliers/{id}/` | Eliminar un proveedor | — |

Todos los endpoints requieren header:
```
Authorization: Bearer <access_token>
```

**Ejemplo de body para POST/PUT:**
```json
{
  "name": "TechParts S.A.C.",
  "tax_id": "20123456789",
  "contact_name": "Ana García",
  "email": "ana.garcia@techparts.com",
  "phone": "+51 999 123 456",
  "address": "Av. Industrial 567, Piso 3",
  "city": "Lima",
  "country": "Perú",
  "is_active": true
}
```

**Ejemplo de respuesta exitosa (201 Created):**
```json
{
  "id": 1,
  "name": "TechParts S.A.C.",
  "tax_id": "20123456789",
  "contact_name": "Ana García",
  "email": "ana.garcia@techparts.com",
  "phone": "+51 999 123 456",
  "address": "Av. Industrial 567, Piso 3",
  "city": "Lima",
  "country": "Perú",
  "is_active": true,
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T10:00:00Z"
}
```

---

## Validaciones de negocio

En el MVP no hay lógica de negocio compleja para proveedores. Las únicas validaciones son las impuestas por el modelo y DRF:

- `tax_id` debe ser único — DRF retorna `400` con `{"tax_id": ["supplier with this tax id already exists."]}` si se intenta duplicar
- `name`, `tax_id`, `contact_name`, `email`, `phone`, `address`, `city`, `country` son requeridos — DRF retorna `400` con mensaje por campo si se omiten
- `is_active` es opcional en el body de creación — si se omite, el valor por defecto es `true`
- No hay campos nullable en `suppliers_supplier` — todos los campos de texto son requeridos

---

## Notas al Implement Agent

1. **La app vive en la raíz del proyecto**, no bajo `apps/`. Registrar como `'suppliers'` en `INSTALLED_APPS`, no como `'apps.suppliers'`. Esto es coherente con `products` y `warehouses`.

2. **`serializers.py` y `urls.py` no los genera `startapp`**: deben crearse manualmente. No omitirlos.

3. **`services.py` no debe estar vacío ni tener funciones placeholder**: el archivo debe contener únicamente el comentario explicativo definido en T06. No crear funciones `pass` ni clases vacías.

4. **Ningún campo del modelo es nullable**: a diferencia de `warehouses` (que tiene `latitude`/`longitude` opcionales), todos los campos de `suppliers_supplier` son requeridos. No agregar `null=True` ni `blank=True` a ningún campo, con la excepción de `is_active` que tiene `default=True` pero sigue siendo requerido en DB.

5. **`created_at` y `updated_at` son `read_only_fields` en el serializer**: nunca deben ser enviados por el cliente ni aceptados como input. DRF los maneja automáticamente con `auto_now_add` y `auto_now`.

6. **`DefaultRouter` genera automáticamente los 6 endpoints estándar** (list, create, retrieve, update, partial_update, destroy) — no hace falta declararlos manualmente.

7. **La paginación hereda de `REST_FRAMEWORK['DEFAULT_PAGINATION_CLASS']`** configurada en la Fase 1 (`PageNumberPagination`, `PAGE_SIZE=20`). No es necesario configurarla en el ViewSet.

8. **El campo `tax_id` con `unique=True` en el modelo** produce automáticamente la validación de unicidad en DRF — no es necesario agregar `UniqueValidator` en el serializer.

9. **`config/urls.py` ya tiene una línea `path('api/v1/', include('warehouses.urls'))`**: agregar la línea de `suppliers` a continuación, no reemplazarla. Django permite múltiples `include` bajo el mismo prefijo.

10. **Esta app será referenciada como FK en la Fase 7 (`products`)**: no renombrar ni mover el modelo `Supplier` después de crear la primera migración sin hacer una migración de renombrado explícita.
