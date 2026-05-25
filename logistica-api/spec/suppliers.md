# Spec: suppliers — Phase 2

## Contexto

La app `suppliers` gestiona los proveedores de productos tecnológicos del sistema. Es una entidad base del dominio: no tiene FKs hacia otras apps del proyecto. Otras apps (como `products`) sí referenciarán a `suppliers`. Esta app debe estar lista antes de que `products` se implemente (Phase 3).

---

## Dependencias

- **Ninguna dependencia a otras apps del proyecto.** Solo depende del setup base de Phase 1: Django, DRF, `django-filter`, `drf-spectacular`, configuración JWT en `settings.py`.
- Requiere que `config/settings.py` tenga `REST_FRAMEWORK` y `INSTALLED_APPS` correctamente configurados (Phase 1).

---

## Tareas

### TASK-01 — Crear app Django `suppliers` dentro de `apps/`

Ejecutar desde la raíz del proyecto:

```
python manage.py startapp suppliers apps/suppliers
```

Luego actualizar `apps/suppliers/apps.py` y cambiar el campo `name` a:

```
name = 'apps.suppliers'
```

Verificar que se cree la carpeta `apps/suppliers/` con `models.py`, `views.py`, `apps.py`, etc. Si la carpeta `apps/` no existe, crearla primero con un archivo `__init__.py` vacío.

---

### TASK-02 — Crear modelo `Supplier`

En `apps/suppliers/models.py`, definir el modelo con exactamente los siguientes campos según `database-schema.md`:

| Campo | Tipo Django | Detalles |
|---|---|---|
| `name` | `CharField` | `max_length=255`, `null=False` |
| `tax_id` | `CharField` | `max_length=50`, `unique=True`, `null=True`, `blank=True` |
| `email` | `EmailField` | `max_length=254`, `null=False` |
| `phone` | `CharField` | `max_length=20`, `null=True`, `blank=True` |
| `address` | `TextField` | `null=True`, `blank=True` |
| `city` | `CharField` | `max_length=100`, `null=False` |
| `country` | `CharField` | `max_length=100`, `null=False` |
| `is_active` | `BooleanField` | `default=True` |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

La clase `Meta` debe definir:
- `db_table = 'suppliers'`
- `ordering = ['name']`

---

### TASK-03 — Crear serializer `SupplierSerializer`

En `apps/suppliers/serializers.py`, definir un `ModelSerializer` para el modelo `Supplier`:

- `fields = '__all__'`
- `read_only_fields = ['id', 'created_at', 'updated_at']`

No requiere serialización anidada. No requiere sobrescribir `create()` ni `update()`.

---

### TASK-04 — Crear ViewSet `SupplierViewSet`

En `apps/suppliers/views.py`, definir un `ModelViewSet`:

- `queryset`: todos los objetos `Supplier` (sin filtrar por `is_active` en el queryset base, para permitir listar proveedores inactivos si se filtra explícitamente).
- `serializer_class`: `SupplierSerializer`
- `filterset_fields`: `['city', 'country', 'is_active']`
- `search_fields`: `['name', 'email', 'tax_id']`
- `ordering_fields`: `['name', 'created_at']`

No se definen acciones personalizadas (`@action`) en esta app.

---

### TASK-05 — Crear `apps/suppliers/urls.py` con `DefaultRouter`

En `apps/suppliers/urls.py`:

- Instanciar `DefaultRouter`
- Registrar `SupplierViewSet` bajo el prefijo `'suppliers'`
- Exponer `urlpatterns = router.urls`

Los endpoints generados automáticamente serán:
- `GET /api/v1/suppliers/` — listar
- `POST /api/v1/suppliers/` — crear
- `GET /api/v1/suppliers/{id}/` — detalle
- `PUT /api/v1/suppliers/{id}/` — actualización completa
- `PATCH /api/v1/suppliers/{id}/` — actualización parcial
- `DELETE /api/v1/suppliers/{id}/` — eliminar

---

### TASK-06 — Registrar en `INSTALLED_APPS`

En `config/settings.py`, agregar `'apps.suppliers'` a la lista `INSTALLED_APPS`.

---

### TASK-07 — Incluir URLs en `config/urls.py`

En `config/urls.py`, dentro del bloque `api/v1/`, agregar:

```
path('', include('apps.suppliers.urls')),
```

La ruta final de los endpoints será `http://localhost:8000/api/v1/suppliers/`.

---

### TASK-08 — Crear migración y aplicarla

Ejecutar:

```
python manage.py makemigrations suppliers
python manage.py migrate
```

Verificar que la tabla `suppliers` se crea correctamente en la base de datos.

---

### TASK-09 — Escribir tests

En `suppliers/tests/`:

- Crear `__init__.py` vacío
- `test_models.py`: verificar que un `Supplier` se crea con los campos requeridos, que `is_active` es `True` por defecto, y que `tax_id` admite valores nulos y únicos.
- `test_views.py`: usar `APITestCase`. Cubrir:
  - `POST /api/v1/suppliers/` — creación exitosa (201)
  - `POST /api/v1/suppliers/` — datos inválidos (400, ej: `email` vacío)
  - `GET /api/v1/suppliers/` — listado (200)
  - `GET /api/v1/suppliers/{id}/` — detalle (200)
  - `GET /api/v1/suppliers/{id}/` — no encontrado (404)
  - `PUT /api/v1/suppliers/{id}/` — actualización completa (200)
  - `PATCH /api/v1/suppliers/{id}/` — actualización parcial (200)
  - `DELETE /api/v1/suppliers/{id}/` — eliminación (204)
  - Request sin autenticación (401)

---

## Criterios de aceptación

1. `python manage.py makemigrations suppliers` genera una migración sin errores.
2. `python manage.py migrate` aplica la migración y crea la tabla `suppliers` con todas las columnas del schema.
3. `GET /api/v1/suppliers/` retorna 200 con lista paginada cuando el usuario está autenticado.
4. `GET /api/v1/suppliers/` retorna 401 sin token JWT.
5. `POST /api/v1/suppliers/` con `name`, `email`, `city`, `country` retorna 201 con el objeto creado.
6. `POST /api/v1/suppliers/` sin `email` retorna 400.
7. Dos suppliers con el mismo `tax_id` generan error 400 (unique constraint).
8. `?search=tech` filtra por `name`, `email` o `tax_id`.
9. `?city=Bogotá` filtra por ciudad.
10. `?is_active=false` incluye proveedores inactivos en el listado.
11. `python manage.py test suppliers` ejecuta todos los tests sin fallos.
12. `GET /api/docs/` refleja los endpoints de `suppliers` en la documentación OpenAPI.
