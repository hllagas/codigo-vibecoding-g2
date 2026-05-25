# Spec: products — Phase 3

## Contexto

La app `products` gestiona los artículos de tecnología del sistema (laptops, smartphones, tablets, monitores, servidores, etc.). Cada producto pertenece a un proveedor existente (`Supplier`) y puede estar presente en el stock de uno o varios almacenes. Esta app es una dependencia directa de `warehouse_stock` (Phase 4) y de `shipment_items` (Phase 8): debe estar completamente implementada antes de continuar con esas fases.

---

## Dependencias

- **`suppliers`** (Phase 2): el modelo `Product` tiene FK a `Supplier`. La app `suppliers` debe estar migrada y registrada en `INSTALLED_APPS` antes de ejecutar la migración de `products`.
- Requiere el setup base de Phase 1: Django, DRF, `django-filter`, `drf-spectacular`, configuración JWT en `settings.py`.

---

## Tareas

### TASK-01 — Crear app Django `products` dentro de `apps/`

La carpeta `apps/products/` ya existe como esqueleto vacío generado por el proyecto original. Verificar si contiene archivos (`models.py`, `apps.py`, etc.):
- Si está vacía o es el stub original: usar los archivos existentes y actualizar `apps/products/apps.py` con `name = 'apps.products'`.
- Si no existe: ejecutar `python manage.py startapp products apps/products` y luego actualizar `apps/products/apps.py`.

En cualquier caso, asegurar que `apps/products/apps.py` tenga:
```
name = 'apps.products'
```

Si la carpeta `apps/` no tiene `__init__.py`, crearlo vacío.

---

### TASK-02 — Crear modelo `Product`

En `apps/products/models.py`, definir el modelo con exactamente los siguientes campos según `database-schema.md`:

| Campo | Tipo Django | Detalles |
|---|---|---|
| `name` | `CharField` | `max_length=255`, `null=False` |
| `description` | `TextField` | `null=True`, `blank=True` |
| `sku` | `CharField` | `max_length=100`, `unique=True`, `null=False` |
| `category` | `CharField` | `max_length=100`, `null=False` — valores de ejemplo: `laptop`, `smartphone`, `tablet`, `monitor`, `server` |
| `unit_price` | `DecimalField` | `max_digits=10`, `decimal_places=2`, `null=False` |
| `weight_kg` | `DecimalField` | `max_digits=6`, `decimal_places=3`, `null=False` |
| `supplier` | `ForeignKey` | hacia `'suppliers.Supplier'` (string con app_label), `on_delete=PROTECT`, `null=True`, `blank=True` — se almacena como `supplier_id` en la tabla |
| `is_active` | `BooleanField` | `default=True` |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

La clase `Meta` debe definir:
- `db_table = 'products'`
- `ordering = ['name']`

Notas importantes:
- `category` es un `CharField` libre, **no** un `TextChoices` / `enum`. Los valores de ejemplo (laptop, smartphone, etc.) son orientativos pero cualquier string es válido.
- `on_delete=PROTECT` en el FK a `Supplier` evita eliminar un proveedor que tenga productos asociados.
- El campo FK se llama `supplier` en Python (Django generará `supplier_id` como columna en la tabla), coincidiendo con el nombre `supplier_id` del schema.

---

### TASK-03 — Crear serializer `ProductSerializer`

En `apps/products/serializers.py`, definir un `ModelSerializer` para el modelo `Product`:

- `fields = '__all__'`
- `read_only_fields = ['id', 'created_at', 'updated_at']`

No requiere serialización anidada. El campo `supplier` se representa como su ID entero en la response (comportamiento por defecto de `ModelSerializer` con FK).

No se requiere sobrescribir `create()` ni `update()`.

---

### TASK-04 — Crear ViewSet `ProductViewSet`

En `apps/products/views.py`, definir un `ModelViewSet`:

- `queryset`: todos los objetos `Product` (sin filtrar por `is_active` en el queryset base, para permitir listar productos inactivos si se filtra explícitamente).
- `serializer_class`: `ProductSerializer`
- `filterset_fields`: `['category', 'supplier', 'is_active']` — permite filtrar por `?category=laptop`, `?supplier=3`, `?is_active=false`
- `search_fields`: `['name', 'sku']` — búsqueda de texto libre
- `ordering_fields`: `['name', 'unit_price', 'created_at']`

No se definen acciones personalizadas (`@action`) en esta app.

---

### TASK-05 — Crear `apps/products/urls.py` con `DefaultRouter`

En `apps/products/urls.py`:

- Instanciar `DefaultRouter`
- Registrar `ProductViewSet` bajo el prefijo `'products'`
- Exponer `urlpatterns = router.urls`

Los endpoints generados automáticamente serán:
- `GET /api/v1/products/` — listar
- `POST /api/v1/products/` — crear
- `GET /api/v1/products/{id}/` — detalle
- `PUT /api/v1/products/{id}/` — actualización completa
- `PATCH /api/v1/products/{id}/` — actualización parcial
- `DELETE /api/v1/products/{id}/` — eliminar

---

### TASK-06 — Registrar en `INSTALLED_APPS`

En `config/settings.py`, agregar `'apps.products'` a la lista `INSTALLED_APPS`.

La app `apps.suppliers` ya debe estar presente en `INSTALLED_APPS` antes de `apps.products` (dependencia de FK).

---

### TASK-07 — Incluir URLs en `config/urls.py`

En `config/urls.py`, dentro del bloque `api/v1/`, agregar:

```
path('', include('apps.products.urls')),
```

La ruta final de los endpoints será `http://localhost:8000/api/v1/products/`.

---

### TASK-08 — Crear migración y aplicarla

Ejecutar:

```
python manage.py makemigrations products
python manage.py migrate
```

Verificar que la tabla `products` se crea correctamente con todas las columnas del schema, incluida la FK `supplier_id` con constraint `PROTECT`.

---

### TASK-09 — Escribir tests

En `products/tests/`:

- Crear `__init__.py` vacío
- `test_models.py`: verificar que un `Product` se crea con los campos requeridos, que `is_active` es `True` por defecto, que `sku` es único (dos productos con el mismo `sku` fallan), y que `description` admite valores nulos.
- `test_views.py`: usar `APITestCase`. Cubrir:
  - `POST /api/v1/products/` — creación exitosa (201)
  - `POST /api/v1/products/` — datos inválidos (400, ej: `sku` ausente)
  - `POST /api/v1/products/` — `sku` duplicado (400, unique constraint)
  - `GET /api/v1/products/` — listado (200)
  - `GET /api/v1/products/?category=laptop` — filtrado por category (200)
  - `GET /api/v1/products/?search=monitor` — búsqueda por name/sku (200)
  - `GET /api/v1/products/{id}/` — detalle (200)
  - `GET /api/v1/products/{id}/` — no encontrado (404)
  - `PUT /api/v1/products/{id}/` — actualización completa (200)
  - `PATCH /api/v1/products/{id}/` — actualización parcial (200)
  - `DELETE /api/v1/products/{id}/` — eliminación (204)
  - Request sin autenticación (401)

---

## Criterios de aceptación

1. `python manage.py makemigrations products` genera una migración sin errores.
2. `python manage.py migrate` aplica la migración y crea la tabla `products` con todas las columnas del schema.
3. `GET /api/v1/products/` retorna 200 con lista paginada cuando el usuario está autenticado.
4. `GET /api/v1/products/` retorna 401 sin token JWT.
5. `POST /api/v1/products/` con `name`, `sku`, `category`, `unit_price`, `weight_kg` retorna 201 con el objeto creado.
6. `POST /api/v1/products/` sin `sku` retorna 400.
7. Dos productos con el mismo `sku` generan error 400 (unique constraint).
8. `?category=laptop` filtra por categoría exacta.
9. `?supplier=<id>` filtra por proveedor.
10. `?search=dell` filtra por `name` o `sku`.
11. `?ordering=unit_price` ordena por precio unitario ascendente.
12. `?is_active=false` incluye productos inactivos en el listado.
13. Intentar eliminar un `Supplier` que tiene productos asociados retorna error (PROTECT constraint).
14. `python manage.py test products` ejecuta todos los tests sin fallos.
15. `GET /api/docs/` refleja los endpoints de `products` en la documentación OpenAPI.
