# Spec: Fase 7 — `products`

## Contexto

App Django que gestiona los productos tecnológicos disponibles para envío. A diferencia de las apps de fases anteriores, `products` ya existe como scaffold vacío en la raíz del proyecto — fue creada con `startapp` pero nunca completada. El trabajo de esta fase consiste en completar los archivos existentes y agregar los que faltan, **no ejecutar `startapp` de nuevo**.

La tabla resultante (`products_product`) referencia `warehouses_warehouse` y `suppliers_supplier` mediante FK, por lo que las Fases 2 y 3 deben estar completamente migradas antes de iniciar esta fase. La tabla será referenciada a su vez por `shipments_shipmentproduct` en la Fase 9 — no renombrar ni mover el modelo `Product` después de crear la primera migración sin una migración de renombrado explícita.

**Nota de arquitectura**: la app vive en la raíz del proyecto (mismo nivel que `warehouses/`, `suppliers/` y `manage.py`), no bajo `apps/`. Ya está registrada como `'products'` en `INSTALLED_APPS` desde el estado inicial del proyecto.

## Dependencias

- **Fase 1** completada: `config/settings.py` con `REST_FRAMEWORK`, JWT y migraciones iniciales aplicadas.
- **Fase 2** (`warehouses`) completada: tabla `warehouses_warehouse` migrada — `Product` tiene FK hacia ella.
- **Fase 3** (`suppliers`) completada: tabla `suppliers_supplier` migrada — `Product` tiene FK hacia ella.

---

## Estado actual del scaffold

El directorio `products/` ya existe con los siguientes archivos:

| Archivo | Estado | Acción en esta fase |
|---|---|---|
| `apps.py` | Completo (`name = 'products'`) | Sin cambios — ya es correcto |
| `models.py` | Scaffold vacío | Completar con el modelo `Product` |
| `views.py` | Scaffold vacío | Completar con `ProductViewSet` |
| `admin.py` | Scaffold vacío | No se requieren cambios en MVP |
| `tests.py` | Scaffold vacío | Completar en T10 |
| `migrations/` | Solo `__init__.py` | Generar y aplicar en T09 |
| `serializers.py` | No existe | Crear en T04 |
| `services.py` | No existe | Crear en T05 |
| `urls.py` | No existe | Crear en T06 |

---

## Tareas

### T01 — Verificar `products/apps.py`

- [ ] Abrir `products/apps.py`
- [ ] Verificar que `name = 'products'` y `default_auto_field = 'django.db.models.BigAutoField'`
- [ ] Si `default_auto_field` no está presente, agregarlo

El archivo debe quedar exactamente así:

```python
from django.apps import AppConfig


class ProductsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'products'
```

- [ ] Verificar que `'products'` ya está en `INSTALLED_APPS` en `config/settings.py` — ya está presente desde el estado inicial, no agregar de nuevo

**Verificacion**: `python manage.py check` no reporta errores relacionados con `products` no registrada.

---

### T02 — `products/models.py`

- [ ] Reemplazar el contenido del scaffold vacío con el modelo `Product`
- [ ] Importar `MinValueValidator` desde `django.core.validators` para aplicar la restriccion `stock >= 0`
- [ ] Definir las FK con `on_delete=models.PROTECT` — no se puede eliminar un supplier o warehouse si tiene productos asociados
- [ ] Crear el modelo `Product` con todos los campos del schema `products_product`:

| Campo | Tipo Django | Restricciones |
|---|---|---|
| `supplier` | `ForeignKey('suppliers.Supplier', on_delete=models.PROTECT)` | requerido, `related_name='products'` |
| `warehouse` | `ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT)` | requerido, `related_name='products'` |
| `name` | `CharField(max_length=200)` | requerido |
| `sku` | `CharField(max_length=50)` | `unique=True` |
| `description` | `TextField()` | `null=True, blank=True` |
| `unit_price` | `DecimalField(max_digits=10, decimal_places=2)` | requerido |
| `weight_kg` | `DecimalField(max_digits=8, decimal_places=3)` | requerido |
| `length_cm` | `DecimalField(max_digits=8, decimal_places=2)` | `null=True, blank=True` |
| `width_cm` | `DecimalField(max_digits=8, decimal_places=2)` | `null=True, blank=True` |
| `height_cm` | `DecimalField(max_digits=8, decimal_places=2)` | `null=True, blank=True` |
| `stock` | `IntegerField(validators=[MinValueValidator(0)])` | requerido, valor minimo 0 |
| `is_active` | `BooleanField(default=True)` | — |
| `created_at` | `DateTimeField(auto_now_add=True)` | automatico |
| `updated_at` | `DateTimeField(auto_now=True)` | automatico |

- [ ] Agregar clase `Meta` con:
  - `ordering = ['name']`
  - `verbose_name = 'product'`
  - `verbose_name_plural = 'products'`
- [ ] Agregar metodo `__str__` que retorne `f"{self.sku} — {self.name}"`

**Verificacion**: `python manage.py check` no reporta errores de modelos. `python manage.py makemigrations --check products` detecta cambios pendientes (indica que el modelo esta definido correctamente).

---

### T03 — `products/serializers.py`

- [ ] Crear el archivo `products/serializers.py` (no existe — `startapp` no lo genera)
- [ ] El serializer debe soportar dos modos: escritura con IDs de FK y lectura con datos anidados del supplier y warehouse

#### Serializer anidado de lectura

Crear un serializer auxiliar liviano `SupplierSummarySerializer` que exponga solo `id` y `name` del supplier. Crear otro `WarehouseSummarySerializer` que exponga solo `id` y `name` del warehouse. Ambos son de solo lectura y se usan exclusivamente para la representacion de salida.

#### `ProductSerializer`

Crear `ProductSerializer` extendiendo `ModelSerializer` con la siguiente logica:

- **Escritura (POST/PUT/PATCH)**: los campos `supplier` y `warehouse` se reciben como enteros (IDs de FK) usando `PrimaryKeyRelatedField`. DRF maneja esto por defecto cuando los campos del modelo son FK.
- **Lectura (GET)**: los campos `supplier` y `warehouse` deben devolver un objeto con `id` y `name`, no solo el entero. Lograr esto sobrescribiendo el metodo `to_representation` del serializer para reemplazar los campos FK con los serializers auxiliares en la respuesta.

Configuracion de `Meta`:
- `Meta.model = Product`
- `Meta.fields = '__all__'`
- `Meta.read_only_fields = ['id', 'created_at', 'updated_at']`

Comportamiento esperado en escritura (body de POST):
```json
{
  "supplier": 1,
  "warehouse": 2,
  "name": "Laptop Dell XPS 15",
  "sku": "DELL-XPS15-001",
  "unit_price": "2500.00",
  "weight_kg": "2.100",
  "stock": 50
}
```

Comportamiento esperado en lectura (respuesta GET):
```json
{
  "id": 1,
  "supplier": { "id": 1, "name": "TechParts S.A.C." },
  "warehouse": { "id": 2, "name": "Almacen Central Lima" },
  "name": "Laptop Dell XPS 15",
  "sku": "DELL-XPS15-001",
  "description": null,
  "unit_price": "2500.00",
  "weight_kg": "2.100",
  "length_cm": null,
  "width_cm": null,
  "height_cm": null,
  "stock": 50,
  "is_active": true,
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T10:00:00Z"
}
```

- [ ] El campo `sku` con `unique=True` es manejado automaticamente por DRF — no agregar `UniqueValidator` manualmente

**Verificacion**: desde Django shell, importar `ProductSerializer` sin errores.

---

### T04 — `products/services.py`

- [ ] Crear el archivo `products/services.py` (no existe — `startapp` no lo genera)
- [ ] Implementar la funcion `update_stock(product, quantity, operation)` con la siguiente especificacion:

#### Funcion `update_stock`

**Proposito**: incrementar o decrementar el campo `stock` de un `Product` con validacion de que el stock nunca quede negativo. Es la unica funcion de negocio de esta app en el MVP. Sera llamada por `shipments/services.py` en la Fase 9 al crear un envio.

**Parametros**:

| Parametro | Tipo | Descripcion |
|---|---|---|
| `product` | instancia de `Product` | El producto cuyo stock se va a modificar |
| `quantity` | `int` | Cantidad a sumar o restar. Siempre positivo — la operacion determina la direccion |
| `operation` | `str` | Valor esperado: `'INCR'` para incrementar, `'DECR'` para decrementar |

**Logica**:

1. Si `operation == 'INCR'`: calcular `nuevo_stock = product.stock + quantity`
2. Si `operation == 'DECR'`:
   - Calcular `nuevo_stock = product.stock - quantity`
   - Si `nuevo_stock < 0`: lanzar `ValidationError` con mensaje que indique stock insuficiente, incluyendo el stock actual y la cantidad solicitada
3. Si `operation` no es `'INCR'` ni `'DECR'`: lanzar `ValidationError` con mensaje que indique que la operacion no es valida
4. Asignar `product.stock = nuevo_stock`
5. Llamar `product.save(update_fields=['stock', 'updated_at'])` para persistir solo los campos modificados

**Validacion de stock negativo** (paso 2):
- Condicion: `product.stock - quantity < 0`
- Excepcion: `django.core.exceptions.ValidationError`
- El mensaje debe ser descriptivo: indicar el SKU del producto, el stock actual disponible y la cantidad solicitada para decrementar

**Imports necesarios**:
- `from django.core.exceptions import ValidationError`

**No debe**:
- Hacer queries adicionales a la base de datos — recibe la instancia ya cargada
- Manejar logica HTTP ni acceder a `request`
- Llamar a otros services

**Verificacion**: desde Django shell, se puede importar `update_stock` desde `products.services` sin errores.

---

### T05 — `products/views.py`

- [ ] Reemplazar el contenido del scaffold vacío en `products/views.py`
- [ ] Crear `ProductViewSet` extendiendo `ModelViewSet`:
  - `queryset = Product.objects.select_related('supplier', 'warehouse').all()`
    - Usar `select_related` porque el serializer accede a los campos del supplier y warehouse en cada objeto — evita N+1 queries
  - `serializer_class = ProductSerializer`
  - Sin permisos custom en MVP — hereda `DEFAULT_PERMISSION_CLASSES` de `REST_FRAMEWORK` (JWT requerido)
  - Sin acciones custom (`@action`) — `update_stock` es llamado internamente por shipments, no expuesto como endpoint propio en el MVP
- [ ] No agregar logica de negocio en la vista — la funcion `update_stock` vive en `services.py` y es invocada desde `shipments/services.py`

**Verificacion**: desde Django shell, importar `ProductViewSet` sin errores.

---

### T06 — `products/urls.py`

- [ ] Crear el archivo `products/urls.py` (no existe — `startapp` no lo genera)
- [ ] Registrar `ProductViewSet` usando `DefaultRouter` de DRF con el prefix `products`:

```python
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)

urlpatterns = router.urls
```

**Verificacion**: el archivo existe y se puede importar sin errores.

---

### T07 — Incluir en `config/urls.py`

- [ ] Abrir `config/urls.py`
- [ ] Agregar el `include` de `products.urls` bajo el prefijo `/api/v1/`, a continuacion de las demas apps ya registradas:

```python
path('api/v1/', include('products.urls')),
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
    path('api/v1/', include('customers.urls')),
    path('api/v1/', include('drivers.urls')),
    path('api/v1/', include('transports.urls')),
    path('api/v1/', include('products.urls')),   # <- agregar aqui
]
```

**Verificacion**: `python manage.py check` no reporta errores de URL.

---

### T08 — `products/tests.py`

- [ ] Reemplazar el contenido del scaffold vacío en `products/tests.py`
- [ ] Crear una clase `TestUpdateStock` que pruebe la funcion `update_stock` de `services.py`:

**Casos de prueba requeridos**:

| Nombre del test | Descripcion |
|---|---|
| `test_incr_aumenta_stock` | `INCR` con quantity=10 sobre un producto con stock=5 resulta en stock=15 |
| `test_decr_reduce_stock` | `DECR` con quantity=3 sobre un producto con stock=10 resulta en stock=7 |
| `test_decr_a_cero` | `DECR` con quantity=5 sobre un producto con stock=5 resulta en stock=0 (caso limite valido) |
| `test_decr_stock_negativo_lanza_error` | `DECR` con quantity=10 sobre un producto con stock=5 lanza `ValidationError` |
| `test_operacion_invalida_lanza_error` | Pasar `operation='INVALID'` lanza `ValidationError` |

- [ ] Usar `TestCase` de Django para tener acceso a la base de datos de prueba
- [ ] Crear instancias de `Supplier` y `Warehouse` como fixtures de setUp para poder instanciar `Product` (los campos FK son requeridos)
- [ ] No hacer tests de endpoints HTTP en esta fase — los tests de views se agregan en una fase de QA posterior

**Verificacion**: `python manage.py test products` ejecuta los tests sin errores de importacion ni de configuracion.

---

### T09 — Crear y aplicar migraciones

- [ ] Ejecutar `python manage.py makemigrations products`
  - Debe generar `products/migrations/0001_initial.py`
  - Verificar que el archivo generado incluye:
    - FK hacia `suppliers.Supplier` con `on_delete=PROTECT`
    - FK hacia `warehouses.Warehouse` con `on_delete=PROTECT`
    - Todos los campos del schema: `name`, `sku`, `description`, `unit_price`, `weight_kg`, `length_cm`, `width_cm`, `height_cm`, `stock`, `is_active`, `created_at`, `updated_at`
    - El validador `MinValueValidator(0)` en `stock`
- [ ] Ejecutar `python manage.py migrate`
  - Debe aplicar `products.0001_initial` sin errores
  - Las tablas de `warehouses` y `suppliers` deben existir previamente — si la migracion falla por FK faltantes, verificar que las Fases 2 y 3 esten migradas

**Verificacion**: `python manage.py migrate --check` retorna sin pendientes. La tabla `products_product` existe en `db.sqlite3`.

---

### T10 — Verificacion integral de la Fase 7

- [ ] `python manage.py check` retorna "System check identified no issues"
- [ ] `python manage.py migrate --check` retorna sin pendientes
- [ ] Desde Django shell: `from products.models import Product; print(Product._meta.fields)` muestra todos los campos esperados incluyendo `supplier_id` y `warehouse_id`
- [ ] Desde Django shell: `from products.serializers import ProductSerializer; print(ProductSerializer().fields.keys())` muestra todos los campos
- [ ] Desde Django shell: `from products.services import update_stock; print(update_stock)` no lanza errores de importacion
- [ ] `python manage.py test products` — todos los tests de `TestUpdateStock` pasan
- [ ] Con el servidor activo (iniciado manualmente por el usuario): `GET /api/v1/products/` retorna `401` sin token JWT y `200` con token valido

---

## Endpoints resultantes

| Metodo | URL | Descripcion | Body requerido |
|---|---|---|---|
| GET | `/api/v1/products/` | Listar todos los productos (paginado) | — |
| POST | `/api/v1/products/` | Crear un producto nuevo | Ver campos requeridos |
| GET | `/api/v1/products/{id}/` | Obtener un producto por ID | — |
| PUT | `/api/v1/products/{id}/` | Actualizar todos los campos | Ver campos requeridos |
| PATCH | `/api/v1/products/{id}/` | Actualizar campos parcialmente | Campos a modificar |
| DELETE | `/api/v1/products/{id}/` | Eliminar un producto | — |

Todos los endpoints requieren header:
```
Authorization: Bearer <access_token>
```

**Ejemplo de body para POST/PUT:**
```json
{
  "supplier": 1,
  "warehouse": 2,
  "name": "Laptop Dell XPS 15",
  "sku": "DELL-XPS15-001",
  "description": "Laptop de alto rendimiento con pantalla OLED",
  "unit_price": "2500.00",
  "weight_kg": "2.100",
  "length_cm": "35.70",
  "width_cm": "23.50",
  "height_cm": "1.80",
  "stock": 50,
  "is_active": true
}
```

**Ejemplo de respuesta exitosa (201 Created):**
```json
{
  "id": 1,
  "supplier": { "id": 1, "name": "TechParts S.A.C." },
  "warehouse": { "id": 2, "name": "Almacen Central Lima" },
  "name": "Laptop Dell XPS 15",
  "sku": "DELL-XPS15-001",
  "description": "Laptop de alto rendimiento con pantalla OLED",
  "unit_price": "2500.00",
  "weight_kg": "2.100",
  "length_cm": "35.70",
  "width_cm": "23.50",
  "height_cm": "1.80",
  "stock": 50,
  "is_active": true,
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T10:00:00Z"
}
```

---

## Validaciones de negocio

### Validaciones automaticas de modelo y DRF

- `sku` debe ser unico — DRF retorna `400` con `{"sku": ["product with this sku already exists."]}` si se intenta duplicar
- `supplier` y `warehouse` deben referenciar IDs existentes — DRF retorna `400` si el ID no existe
- `stock` debe ser mayor o igual a 0 — el `MinValueValidator(0)` en el modelo produce `400` si se envia un valor negativo
- `name`, `sku`, `unit_price`, `weight_kg`, `stock`, `supplier`, `warehouse` son requeridos — DRF retorna `400` por campo si se omiten
- `description`, `length_cm`, `width_cm`, `height_cm` son opcionales — se pueden omitir o enviar `null`

### Logica de negocio: `update_stock`

La funcion `update_stock` en `products/services.py` es la unica logica de negocio de esta app. No es invocada directamente por ningun endpoint de `products/` en el MVP — es llamada por `shipments/services.py` en la Fase 9.

**Tabla de comportamiento esperado**:

| Escenario | stock actual | operation | quantity | Resultado |
|---|---|---|---|---|
| Incremento normal | 10 | `INCR` | 5 | stock = 15 |
| Decremento normal | 10 | `DECR` | 3 | stock = 7 |
| Decremento a cero (limite valido) | 5 | `DECR` | 5 | stock = 0 |
| Decremento con stock insuficiente | 5 | `DECR` | 10 | `ValidationError` |
| Operacion invalida | cualquiera | `'FOO'` | cualquiera | `ValidationError` |

**Respuesta de error cuando se llama con stock insuficiente (desde shipments en Fase 9)**:
```json
{ "detail": "Stock insuficiente para el producto DELL-XPS15-001. Stock disponible: 5, cantidad solicitada: 10." }
```

El formato exacto del mensaje queda a criterio del Implement Agent siempre que sea descriptivo e incluya el SKU, el stock actual y la cantidad solicitada.

---

## Notas al Implement Agent

1. **No ejecutar `python manage.py startapp products`**: la app ya existe como scaffold. Solo completar los archivos vacios y crear los que faltan (`serializers.py`, `services.py`, `urls.py`).

2. **`'products'` ya esta en `INSTALLED_APPS`**: no agregarlo de nuevo. Verificar que este antes de ejecutar T09.

3. **FK con `on_delete=PROTECT`**: si se intenta eliminar un `Supplier` o un `Warehouse` que tiene productos asociados, Django lanzara `ProtectedError` (HTTP 409 o 500 segun la configuracion del handler). Esto es el comportamiento correcto para el MVP.

4. **`select_related` en el queryset del ViewSet** (`select_related('supplier', 'warehouse')`): es obligatorio porque el serializer accede a `product.supplier.name` y `product.warehouse.name` en `to_representation`. Sin `select_related`, cada objeto en un listado generara 2 queries adicionales (N+1).

5. **Patron de serializer de lectura/escritura con `to_representation`**: es el patron preferido en este proyecto para FK con datos anidados en lectura. El campo `supplier` acepta un entero en escritura (comportamiento por defecto de `PrimaryKeyRelatedField`) y devuelve un objeto `{id, name}` en lectura (via `to_representation`). No usar `depth = 1` — expone mas campos de los necesarios.

6. **`description`, `length_cm`, `width_cm`, `height_cm` son `null=True, blank=True`**: ambas opciones son necesarias — `null=True` para la base de datos y `blank=True` para que DRF no los exija en validacion.

7. **`MinValueValidator(0)` en `stock`**: se aplica en el campo del modelo. DRF ejecuta los validators del modelo automaticamente durante la validacion del serializer — no es necesario duplicar la validacion en el serializer.

8. **Los tests en T08 requieren instancias reales de `Supplier` y `Warehouse`**: los campos FK de `Product` no son nullable, por lo que no se puede crear un `Product` en tests sin registros previos de las tablas relacionadas. Crear las instancias en `setUp` del `TestCase`.

9. **`product.save(update_fields=['stock', 'updated_at'])` en `update_stock`**: usar `update_fields` para que Django genere un `UPDATE` que modifica solo esas dos columnas, no un `UPDATE` completo del registro.

10. **Esta app sera referenciada como FK en la Fase 9 (`shipments`)**: `shipments_shipmentproduct` tiene `FK → products_product`. No renombrar ni mover el modelo `Product` despues de crear la primera migracion.

11. **`config/urls.py` ya tiene cinco lineas de `include`**: agregar `path('api/v1/', include('products.urls'))` a continuacion de las existentes. No reemplazar ninguna linea existente.

12. **El campo `default_auto_field` en `apps.py` actualmente no esta definido** — el scaffold original no lo incluye. Agregarlo en T01 para mantener coherencia con las otras apps del proyecto y evitar advertencias de Django sobre el tipo de PK por defecto.
