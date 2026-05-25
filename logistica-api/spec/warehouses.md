# Spec: warehouses — Phase 2

## Contexto

La app `warehouses` gestiona los almacenes de donde se despachan los productos. Es una entidad base del dominio sin FKs hacia otras apps del proyecto en esta fase. En fases posteriores, `warehouse_stock` (Phase 4) creará una relación M2M entre `warehouses` y `products`.

Esta app expone un endpoint custom `GET /warehouses/{id}/stock/` que en esta fase se implementa como **placeholder** (retorna una respuesta vacía o un mensaje indicando que la funcionalidad estará disponible en Phase 4). No se implementa la lógica real de stock todavía.

---

## Dependencias

- **Ninguna dependencia a otras apps del proyecto.** Solo depende del setup base de Phase 1.
- La acción custom `stock` se registra en el ViewSet pero su implementación completa llega en Phase 4, cuando `warehouse_stock` y `products` existan.

---

## Tareas

### TASK-01 — Crear app Django `warehouses` dentro de `apps/`

Ejecutar desde la raíz del proyecto:

```
python manage.py startapp warehouses apps/warehouses
```

Luego actualizar `apps/warehouses/apps.py` y cambiar el campo `name` a:

```
name = 'apps.warehouses'
```

Si la carpeta `apps/` no existe aún, crearla con un `__init__.py` vacío.

---

### TASK-02 — Crear modelo `Warehouse`

En `apps/warehouses/models.py`, definir el modelo con exactamente los siguientes campos según `database-schema.md`:

| Campo | Tipo Django | Detalles |
|---|---|---|
| `name` | `CharField` | `max_length=255`, `null=False` |
| `address` | `TextField` | `null=False` |
| `city` | `CharField` | `max_length=100`, `null=False` |
| `country` | `CharField` | `max_length=100`, `null=False` |
| `latitude` | `DecimalField` | `max_digits=9`, `decimal_places=6`, `null=True`, `blank=True` |
| `longitude` | `DecimalField` | `max_digits=9`, `decimal_places=6`, `null=True`, `blank=True` |
| `capacity` | `IntegerField` | `null=False` |
| `is_active` | `BooleanField` | `default=True` |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

La clase `Meta` debe definir:
- `db_table = 'warehouses'`
- `ordering = ['name']`

---

### TASK-03 — Crear serializer `WarehouseSerializer`

En `apps/warehouses/serializers.py`, definir un `ModelSerializer` para el modelo `Warehouse`:

- `fields = '__all__'`
- `read_only_fields = ['id', 'created_at', 'updated_at']`

No requiere serialización anidada ni sobrescritura de `create()` / `update()`.

---

### TASK-04 — Crear ViewSet `WarehouseViewSet`

En `apps/warehouses/views.py`, definir un `ModelViewSet`:

- `queryset`: todos los objetos `Warehouse`
- `serializer_class`: `WarehouseSerializer`
- `filterset_fields`: `['city', 'country', 'is_active']`
- `search_fields`: `['name', 'address', 'city']`
- `ordering_fields`: `['name', 'capacity', 'created_at']`

Adicionalmente, definir una acción personalizada `stock` con el decorador `@action`:

- `methods`: `['get']`
- `detail`: `True` (opera sobre un almacén específico: `/warehouses/{id}/stock/`)
- `url_path`: `'stock'`
- Implementación en Phase 2: retornar una respuesta con HTTP 200 y un payload JSON que indique que el endpoint es un placeholder. Ejemplo de payload:
  ```
  {"detail": "Stock functionality will be available in Phase 4."}
  ```
- La implementación real (consultar `warehouse_stock`) se completa en Phase 4.

---

### TASK-05 — Crear `apps/warehouses/urls.py` con `DefaultRouter`

En `apps/warehouses/urls.py`:

- Instanciar `DefaultRouter`
- Registrar `WarehouseViewSet` bajo el prefijo `'warehouses'`
- Exponer `urlpatterns = router.urls`

Los endpoints generados automáticamente serán:
- `GET /api/v1/warehouses/` — listar
- `POST /api/v1/warehouses/` — crear
- `GET /api/v1/warehouses/{id}/` — detalle
- `PUT /api/v1/warehouses/{id}/` — actualización completa
- `PATCH /api/v1/warehouses/{id}/` — actualización parcial
- `DELETE /api/v1/warehouses/{id}/` — eliminar
- `GET /api/v1/warehouses/{id}/stock/` — placeholder de stock (acción custom)

---

### TASK-06 — Registrar en `INSTALLED_APPS`

En `config/settings.py`, agregar `'apps.warehouses'` a la lista `INSTALLED_APPS`.

---

### TASK-07 — Incluir URLs en `config/urls.py`

En `config/urls.py`, dentro del bloque `api/v1/`, agregar:

```
path('', include('apps.warehouses.urls')),
```

La ruta final será `http://localhost:8000/api/v1/warehouses/`.

---

### TASK-08 — Crear migración y aplicarla

Ejecutar:

```
python manage.py makemigrations warehouses
python manage.py migrate
```

Verificar que la tabla `warehouses` se crea correctamente con todas las columnas.

---

### TASK-09 — Escribir tests

En `warehouses/tests/`:

- Crear `__init__.py` vacío
- `test_models.py`: verificar que un `Warehouse` se crea con los campos requeridos, que `is_active` es `True` por defecto, y que `latitude`/`longitude` admiten valores nulos.
- `test_views.py`: usar `APITestCase`. Cubrir:
  - `POST /api/v1/warehouses/` — creación exitosa (201)
  - `POST /api/v1/warehouses/` — datos inválidos (400, ej: `capacity` ausente)
  - `GET /api/v1/warehouses/` — listado (200)
  - `GET /api/v1/warehouses/{id}/` — detalle (200)
  - `GET /api/v1/warehouses/{id}/` — no encontrado (404)
  - `PUT /api/v1/warehouses/{id}/` — actualización completa (200)
  - `PATCH /api/v1/warehouses/{id}/` — actualización parcial (200)
  - `DELETE /api/v1/warehouses/{id}/` — eliminación (204)
  - `GET /api/v1/warehouses/{id}/stock/` — retorna 200 con payload placeholder
  - Request sin autenticación (401)

---

## Criterios de aceptación

1. `python manage.py makemigrations warehouses` genera una migración sin errores.
2. `python manage.py migrate` crea la tabla `warehouses` con todas las columnas del schema.
3. `GET /api/v1/warehouses/` retorna 200 con lista paginada cuando el usuario está autenticado.
4. `GET /api/v1/warehouses/` retorna 401 sin token JWT.
5. `POST /api/v1/warehouses/` con `name`, `address`, `city`, `country`, `capacity` retorna 201.
6. `POST /api/v1/warehouses/` sin `capacity` retorna 400.
7. `latitude` y `longitude` son opcionales: un warehouse puede crearse sin ellos.
8. `?search=norte` filtra por `name`, `address` o `city`.
9. `?city=Lima` filtra por ciudad.
10. `?ordering=capacity` ordena los resultados por capacidad ascendente.
11. `GET /api/v1/warehouses/{id}/stock/` retorna 200 con un mensaje placeholder (no 404 ni 501).
12. `python manage.py test warehouses` ejecuta todos los tests sin fallos.
13. `GET /api/docs/` refleja los endpoints de `warehouses`, incluida la acción `stock`, en la documentación OpenAPI.
