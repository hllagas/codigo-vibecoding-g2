# Spec: warehouse_stock — Phase 4

## Contexto

`warehouse_stock` **no es una app nueva**. Es un modelo adicional que se agrega a la app `warehouses` existente para representar la relación M2M entre almacenes y productos con un campo extra `quantity`. Esta fase completa la acción `stock` del `WarehouseViewSet`, que actualmente devuelve un placeholder.

Al finalizar esta fase, el endpoint `GET /api/v1/warehouses/{id}/stock/` retornará la lista real de productos en stock con su cantidad disponible.

---

## Dependencias

- **`warehouses`** (Phase 2): el modelo `WarehouseStock` vive dentro de esta app. La tabla `warehouses` ya debe existir.
- **`products`** (Phase 3): el modelo `WarehouseStock` tiene FK a `Product`. La tabla `products` ya debe existir y estar migrada antes de ejecutar la migración de esta fase.
- No se crea ninguna app nueva. No se agregan URLs de primer nivel.

---

## Tareas

### TASK-01 — Agregar modelo `WarehouseStock` a `warehouses/models.py`

En `apps/warehouses/models.py`, **al final del archivo existente** (sin modificar el modelo `Warehouse`), agregar el modelo `WarehouseStock` con los siguientes campos según `database-schema.md`:

| Campo | Tipo Django | Detalles |
|---|---|---|
| `warehouse` | `ForeignKey` | hacia `Warehouse`, `on_delete=CASCADE` — se almacena como `warehouse_id` |
| `product` | `ForeignKey` | hacia `products.Product`, `on_delete=CASCADE` — se almacena como `product_id` |
| `quantity` | `IntegerField` | `default=0`, `null=False` — unidades disponibles |
| `updated_at` | `DateTimeField` | `auto_now=True` |

Notas importantes sobre el modelo:
- **No tiene `created_at`**: el schema define solo `updated_at` para esta tabla.
- La FK a `Product` debe usar la referencia de string `'products.Product'` (app_label `products`, no el path completo `apps.products.Product`) para evitar importación circular entre apps.
- La FK a `Warehouse` puede referenciarse directamente como `Warehouse` (misma app) o como string `'Warehouse'`.

La clase `Meta` debe definir:
- `db_table = 'warehouse_stock'`
- `unique_together = [('warehouse', 'product')]` — un producto no puede aparecer dos veces en el mismo almacén

---

### TASK-02 — Agregar `WarehouseStockSerializer` a `warehouses/serializers.py`

En `apps/warehouses/serializers.py`, **al final del archivo existente** (sin modificar `WarehouseSerializer`), agregar `WarehouseStockSerializer`:

- `ModelSerializer` para el modelo `WarehouseStock`
- `fields = '__all__'`
- `read_only_fields = ['id', 'updated_at']`

No requiere serialización anidada de `Product` para el MVP. El campo `product` se representa como su ID entero.

---

### TASK-03 — Reemplazar acción `stock` placeholder en `WarehouseViewSet`

En `apps/warehouses/views.py`, reemplazar la implementación placeholder de la acción `stock` por la lógica real:

- Obtener el objeto `Warehouse` correspondiente al `pk` recibido (si no existe, retornar 404).
- Consultar todos los registros de `WarehouseStock` cuyo `warehouse` sea el almacén encontrado.
- Serializar los resultados con `WarehouseStockSerializer`.
- Retornar HTTP 200 con la lista serializada.

El decorador `@action` existente no cambia:
- `methods`: `['get']`
- `detail`: `True`
- `url_path`: `'stock'`

Agregar los imports necesarios: `WarehouseStock` y `WarehouseStockSerializer`.

---

### TASK-04 — Generar y aplicar migración de `warehouses`

Ejecutar:

```
python manage.py makemigrations warehouses
python manage.py migrate
```

Verificar que la migración crea la tabla `warehouse_stock` con las columnas `id`, `warehouse_id`, `product_id`, `quantity`, `updated_at`, y el índice único sobre (`warehouse_id`, `product_id`).

---

### TASK-05 — Escribir tests

En `warehouses/tests/` (el directorio de tests ya existe de Phase 2 — agregar archivos o ampliar los existentes):

- `test_models.py` — agregar casos para `WarehouseStock`:
  - Un `WarehouseStock` se crea con `warehouse`, `product` y `quantity` correctamente.
  - `quantity` es `0` por defecto.
  - Crear dos registros con el mismo `(warehouse, product)` lanza `IntegrityError` (unique_together).
- `test_views.py` — reemplazar o ampliar el test del placeholder:
  - `GET /api/v1/warehouses/{id}/stock/` retorna 200 con lista vacía cuando no hay stock registrado.
  - `GET /api/v1/warehouses/{id}/stock/` retorna 200 con los registros de stock cuando existen.
  - `GET /api/v1/warehouses/{id}/stock/` con `id` inexistente retorna 404.
  - Request sin autenticación retorna 401.

---

## Criterios de aceptación

1. `python manage.py makemigrations warehouses` genera una nueva migración sin errores.
2. `python manage.py migrate` crea la tabla `warehouse_stock` con las columnas y el constraint único del schema.
3. `GET /api/v1/warehouses/{id}/stock/` retorna 200 con lista vacía `[]` cuando el almacén existe pero no tiene stock registrado.
4. `GET /api/v1/warehouses/{id}/stock/` retorna 200 con la lista de objetos `WarehouseStock` cuando hay registros.
5. `GET /api/v1/warehouses/{id}/stock/` retorna 404 cuando el almacén no existe.
6. `GET /api/v1/warehouses/{id}/stock/` retorna 401 sin token JWT.
7. La respuesta ya no contiene el mensaje placeholder `"Stock functionality will be available in Phase 4."`.
8. Intentar crear dos registros `WarehouseStock` con el mismo `(warehouse_id, product_id)` falla por unique constraint.
9. Los endpoints CRUD de `warehouses` existentes continúan funcionando sin regresiones.
10. `python manage.py test warehouses` ejecuta todos los tests (incluidos los nuevos de stock) sin fallos.
11. `GET /api/docs/` refleja la acción `stock` con su schema real en la documentación OpenAPI.
