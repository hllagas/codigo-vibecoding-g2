# Spec: Fase 9 — `shipments`

## Contexto

App Django que gestiona envios de productos tecnologicos — la unidad central de negocio de la API. Es la fase mas compleja del proyecto: introduce dos modelos (`Shipment` y `ShipmentProduct`), cuatro funciones de servicio con logica de negocio no trivial, dos ViewSets (uno con accion custom), y cuatro serializers con dualidad lectura/escritura.

La app `shipments` **no existe todavia** en el proyecto — no hay scaffold previo bajo `apps/shipments/`. El trabajo de esta fase comienza con `startapp` y procede a implementar todos los archivos.

La tabla `shipments_shipment` referencia seis tablas de fases anteriores:
- `customers_customer` (Fase 4)
- `warehouses_warehouse` (Fase 2)
- `transports_transport` (Fase 6)
- `drivers_driver` (Fase 5)
- `routes_route` (Fase 8)

La tabla `shipments_shipmentproduct` referencia ademas `products_product` (Fase 7). Todas las fases anteriores deben estar completamente migradas antes de iniciar esta fase.

**Nota de arquitectura**: la app vivira bajo `apps/shipments/`, al igual que el resto de apps del proyecto. Su `name` en `apps.py` debe ser `'apps.shipments'` y registrarse asi en `INSTALLED_APPS`.

## Dependencias externas

- **Fase 1** (`config`): `REST_FRAMEWORK`, JWT, grupos de permisos, migraciones iniciales.
- **Fase 2** (`warehouses`): tabla `warehouses_warehouse` — `Shipment.origin_warehouse` la referencia.
- **Fase 4** (`customers`): tabla `customers_customer` — `Shipment.customer` la referencia.
- **Fase 5** (`drivers`): tabla `drivers_driver` — `Shipment.driver` la referencia. El modelo `Driver` tiene `Status.AVAILABLE` y `Status.ON_ROUTE`.
- **Fase 6** (`transports`): tabla `transports_transport` — `Shipment.transport` la referencia. El modelo `Transport` tiene `Status.AVAILABLE` y `Status.IN_ROUTE`.
- **Fase 7** (`products`): tabla `products_product` — `ShipmentProduct.product` la referencia. La funcion `update_stock` en `apps.products.services` es llamada por `apps.shipments.services`.
- **Fase 8** (`routes`): tabla `routes_route` — `Shipment.route` la referencia.

---

## Decision de arquitectura: serializadores de creacion vs. lectura

**Problema**: crear un envio requiere aceptar una lista de productos `[{product_id, quantity}]`, pero listar envios debe devolver objetos expandidos con datos legibles de customer, warehouse, transport, driver y productos. Usar un solo serializer en ambas operaciones genera conflictos de validacion y representacion.

**Decision**: separar en cuatro serializers con responsabilidades claras:

| Serializer | Uso | Descripcion |
|---|---|---|
| `ShipmentProductSerializer` | Lectura (anidado en GET de shipment) | Expande `product` como `{id, name, sku}`, muestra `quantity` y `unit_price` |
| `ShipmentCreateSerializer` | Escritura (POST) | Acepta `products: [{product_id, quantity}]`, delega logica a `create_shipment` del service |
| `ShipmentSerializer` | Lectura (GET list/detail) | Expande todas las FK, incluye lista de `shipment_products` |
| `ShipmentStatusUpdateSerializer` | Escritura (POST accion custom) | Solo campo `status` con validacion de choices |

**Razon**: mantiene la responsabilidad unica de cada serializer, simplifica la validacion de escritura y evita que el serializer de lectura interfiera con la logica de creacion delegada al service.

---

## Estado actual del scaffold

La app `shipments` **no existe**. No hay directorio `apps/shipments/` en el proyecto.

| Archivo | Estado | Accion en esta fase |
|---|---|---|
| `apps/shipments/` | No existe | Crear con `startapp` en T01 |
| `apps/shipments/apps.py` | No existe | Ajustar `name` tras `startapp` en T01 |
| `apps/shipments/models.py` | No existe | Implementar `Shipment` y `ShipmentProduct` en T02 |
| `apps/shipments/serializers.py` | No existe | Crear los cuatro serializers en T03 |
| `apps/shipments/services.py` | No existe | Implementar cuatro funciones de negocio en T04 |
| `apps/shipments/views.py` | No existe | Crear dos ViewSets en T05 |
| `apps/shipments/urls.py` | No existe | Crear en T06 |
| `apps/shipments/tests.py` | No existe | Implementar en T07 |
| `apps/shipments/migrations/` | No existe | Generar y aplicar en T08 |
| `config/settings.py` | Existe — falta `apps.shipments` | Agregar en T01 |
| `config/urls.py` | Existe — falta include de shipments | Agregar en T09 |

---

## Tareas

---

## T01 — Crear la app y registrarla

**Archivo**: `apps/shipments/` (directorio nuevo), `apps/shipments/apps.py`, `config/settings.py`

**Descripcion**: Crear el scaffold de la app con `startapp`, ajustar `name` a `'apps.shipments'` y registrarla en `INSTALLED_APPS`.

- Ejecutar con el entorno virtual activo desde el directorio raiz del proyecto:
  ```
  python manage.py startapp shipments apps/shipments
  ```
  Esto crea `apps/shipments/` con el scaffold estandar de Django.

- Abrir `apps/shipments/apps.py` y modificar el campo `name`:
  - Cambiar el valor generado automaticamente (probablemente `'shipments'`) a `'apps.shipments'`
  - Verificar que `default_auto_field = 'django.db.models.BigAutoField'` esta presente

  El archivo debe quedar asi:
  ```python
  from django.apps import AppConfig


  class ShipmentsConfig(AppConfig):
      default_auto_field = 'django.db.models.BigAutoField'
      name = 'apps.shipments'
  ```

- Abrir `config/settings.py` y agregar `'apps.shipments'` al final de las apps del proyecto en `INSTALLED_APPS`, a continuacion de `'apps.routes'`:
  ```python
  'apps.routes',
  'apps.shipments',   # <- agregar aqui
  ```

**Dependencias**: todas las fases anteriores (1–8) completadas.

**Criterio de aceptacion**: `python manage.py check` no reporta errores relacionados con `apps.shipments` no registrada. El directorio `apps/shipments/` existe con el scaffold generado.

---

## T02 — `apps/shipments/models.py`

**Archivo**: `apps/shipments/models.py`

**Descripcion**: Definir los dos modelos de la app: `Shipment` (unidad central) y `ShipmentProduct` (tabla intermedia M2M con datos extra). Reemplazar el contenido del scaffold vacio.

### Modelo `Shipment`

Importar al inicio del archivo:
```python
import uuid
from django.db import models
from django.utils import timezone
```

Definir la clase interna `Status` como `TextChoices` antes de los campos:

```python
class Status(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PICKED_UP = 'PICKED_UP', 'Picked Up'
    IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
    DELIVERED = 'DELIVERED', 'Delivered'
    CANCELLED = 'CANCELLED', 'Cancelled'
    RETURNED = 'RETURNED', 'Returned'
```

Campos del modelo `Shipment`:

| Campo | Tipo Django | Restricciones |
|---|---|---|
| `tracking_number` | `CharField(max_length=50)` | `unique=True` — generado en `save()` si vacio |
| `customer` | `ForeignKey('apps.customers.Customer', on_delete=models.PROTECT)` | requerido, `related_name='shipments'` |
| `origin_warehouse` | `ForeignKey('apps.warehouses.Warehouse', on_delete=models.PROTECT)` | requerido, `related_name='shipments_origin'` |
| `destination_address` | `TextField()` | requerido |
| `destination_city` | `CharField(max_length=100)` | requerido |
| `destination_country` | `CharField(max_length=100)` | requerido |
| `transport` | `ForeignKey('apps.transports.Transport', on_delete=models.PROTECT)` | `null=True, blank=True`, `related_name='shipments'` |
| `driver` | `ForeignKey('apps.drivers.Driver', on_delete=models.PROTECT)` | `null=True, blank=True`, `related_name='shipments'` |
| `route` | `ForeignKey('apps.routes.Route', on_delete=models.PROTECT)` | `null=True, blank=True`, `related_name='shipments'` |
| `status` | `CharField(max_length=20, choices=Status.choices, default=Status.PENDING)` | — |
| `estimated_delivery_date` | `DateField()` | `null=True, blank=True` |
| `actual_delivery_date` | `DateField()` | `null=True, blank=True` |
| `total_weight_kg` | `DecimalField(max_digits=8, decimal_places=3)` | `default=0` |
| `shipping_cost` | `DecimalField(max_digits=10, decimal_places=2)` | `default=0` |
| `notes` | `TextField()` | `blank=True` |
| `created_at` | `DateTimeField(auto_now_add=True)` | automatico |
| `updated_at` | `DateTimeField(auto_now=True)` | automatico |

Logica de generacion de `tracking_number` — sobreescribir `save()`:

```python
def save(self, *args, **kwargs):
    if not self.tracking_number:
        prefix = uuid.uuid4().hex[:8].upper()
        timestamp = timezone.now().strftime('%Y%m%d')
        self.tracking_number = f"LOG-{prefix}-{timestamp}"
    super().save(*args, **kwargs)
```

Clase `Meta`:
- `ordering = ['-created_at']`
- `verbose_name = 'shipment'`
- `verbose_name_plural = 'shipments'`

Metodo `__str__`: retorna `f"{self.tracking_number} — {self.get_status_display()}"`

### Modelo `ShipmentProduct`

Definir despues de `Shipment` en el mismo archivo.

Campos:

| Campo | Tipo Django | Restricciones |
|---|---|---|
| `shipment` | `ForeignKey('Shipment', on_delete=models.CASCADE)` | requerido, `related_name='shipment_products'` |
| `product` | `ForeignKey('apps.products.Product', on_delete=models.PROTECT)` | requerido, `related_name='shipment_products'` |
| `quantity` | `PositiveIntegerField()` | requerido, minimo 1 |
| `unit_price` | `DecimalField(max_digits=10, decimal_places=2)` | requerido — snapshot del precio al momento del envio |

Clase `Meta`:
- `unique_together = [['shipment', 'product']]` — un producto no puede aparecer dos veces en el mismo envio
- `verbose_name = 'shipment product'`
- `verbose_name_plural = 'shipment products'`

Metodo `__str__`: retorna `f"{self.product.sku} x{self.quantity} — Envio {self.shipment.tracking_number}"`

**Dependencias**: T01.

**Criterio de aceptacion**: `python manage.py check` no reporta errores de modelos. `python manage.py makemigrations --check apps.shipments` detecta cambios pendientes (indica que los modelos estan definidos correctamente).

---

## T03 — `apps/shipments/serializers.py`

**Archivo**: `apps/shipments/serializers.py`

**Descripcion**: Crear los cuatro serializers del modulo. El archivo no existe — `startapp` no lo genera.

### 1. Serializers auxiliares de resumen (solo lectura)

Crear serializers ligeros `Serializer` (no `ModelSerializer`) para representar FK de forma resumida en las respuestas GET. Todos son `read_only`.

**`CustomerSummarySerializer`**: expone `id`, `company_name`, `full_name` (campo `SerializerMethodField` que retorna `instance.user.get_full_name()`).

**`WarehouseSummarySerializer`**: expone `id`, `name`.

**`TransportSummarySerializer`**: expone `id`, `license_plate`.

**`DriverSummarySerializer`**: expone `id`, `full_name` (campo `SerializerMethodField` que retorna `instance.user.get_full_name()`).

**`ProductSummarySerializer`**: expone `id`, `name`, `sku`.

### 2. `ShipmentProductSerializer`

Serializer para el modelo `ShipmentProduct`. Usado en lectura (anidado en `ShipmentSerializer`) y en gestion directa via `ShipmentProductViewSet`.

- `Meta.model = ShipmentProduct`
- `Meta.fields = ['id', 'shipment', 'product', 'quantity', 'unit_price']`
- `Meta.read_only_fields = ['id', 'unit_price']`

Sobreescribir `to_representation` para reemplazar el campo `product` con `ProductSummarySerializer(instance.product).data` en las respuestas GET.

En escritura, `product` acepta un entero (ID de FK) y `unit_price` es de solo lectura — se toma como snapshot del precio del producto en el service.

### 3. `ShipmentCreateSerializer`

Serializer exclusivo para escritura al crear un envio (POST). Acepta la lista de productos como entrada, delega la creacion al service.

Campos:

| Campo | Tipo DRF | Restricciones |
|---|---|---|
| `customer` | `PrimaryKeyRelatedField(queryset=Customer.objects.all())` | requerido |
| `origin_warehouse` | `PrimaryKeyRelatedField(queryset=Warehouse.objects.all())` | requerido |
| `destination_address` | `CharField()` | requerido |
| `destination_city` | `CharField(max_length=100)` | requerido |
| `destination_country` | `CharField(max_length=100)` | requerido |
| `estimated_delivery_date` | `DateField(required=False, allow_null=True)` | opcional |
| `notes` | `CharField(required=False, allow_blank=True)` | opcional |
| `products` | `ListField(child=DictField())` | requerido — lista de `{product_id, quantity}` |

El campo `products` acepta una lista de objetos de la forma:
```json
[
  {"product_id": 1, "quantity": 3},
  {"product_id": 4, "quantity": 1}
]
```

Sobreescribir `validate_products` para verificar:
- La lista no esta vacia — lanzar `ValidationError` si `len(products) == 0`
- Cada elemento tiene `product_id` y `quantity` — lanzar `ValidationError` si falta alguno
- `quantity` es mayor que 0 — lanzar `ValidationError` si alguno es <= 0
- El `product_id` referencia un `Product` existente y activo — lanzar `ValidationError` si no existe o `is_active=False`

Sobreescribir `create` para llamar `create_shipment(validated_data)` desde `apps.shipments.services` y retornar la instancia creada.

### 4. `ShipmentSerializer`

Serializer principal para lectura (GET list y GET detail). Expande todas las FK.

- `Meta.model = Shipment`
- `Meta.fields = '__all__'`
- `Meta.read_only_fields = ['id', 'tracking_number', 'total_weight_kg', 'shipping_cost', 'actual_delivery_date', 'created_at', 'updated_at']`

Sobreescribir `to_representation` para reemplazar:
- `customer` → `CustomerSummarySerializer(instance.customer).data`
- `origin_warehouse` → `WarehouseSummarySerializer(instance.origin_warehouse).data`
- `transport` → `TransportSummarySerializer(instance.transport).data` si no es `None`, si no `None`
- `driver` → `DriverSummarySerializer(instance.driver).data` si no es `None`, si no `None`
- `route` → `{'id': instance.route.id, 'name': instance.route.name}` si no es `None`, si no `None`
- Agregar campo `shipment_products` → `ShipmentProductSerializer(instance.shipment_products.select_related('product').all(), many=True).data`

Comportamiento esperado en lectura (respuesta GET detail):
```json
{
  "id": 1,
  "tracking_number": "LOG-A3F9C2B1-20260526",
  "customer": {"id": 1, "company_name": "TechCorp S.A.", "full_name": "Juan Perez"},
  "origin_warehouse": {"id": 2, "name": "Almacen Central Lima"},
  "destination_address": "Av. Larco 1234",
  "destination_city": "Lima",
  "destination_country": "Peru",
  "transport": {"id": 1, "license_plate": "ABC-123"},
  "driver": {"id": 1, "full_name": "Carlos Lopez"},
  "route": {"id": 2, "name": "Ruta Lima Norte"},
  "status": "PENDING",
  "estimated_delivery_date": "2026-06-01",
  "actual_delivery_date": null,
  "total_weight_kg": "6.300",
  "shipping_cost": "91.75",
  "notes": "",
  "shipment_products": [
    {"id": 1, "product": {"id": 1, "name": "Laptop Dell XPS 15", "sku": "DELL-XPS15-001"}, "quantity": 3, "unit_price": "2500.00"}
  ],
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T10:00:00Z"
}
```

### 5. `ShipmentStatusUpdateSerializer`

Serializer minimo para la accion custom `update_status`. Solo expone el campo `status`.

- Extender `serializers.Serializer` (no `ModelSerializer`)
- Campo `status`: `ChoiceField(choices=Shipment.Status.choices)`
- No incluir ningun otro campo

**Dependencias**: T02.

**Criterio de aceptacion**: desde Django shell, importar los cuatro serializers sin errores de importacion.

---

## T04 — `apps/shipments/services.py`

**Archivo**: `apps/shipments/services.py`

**Descripcion**: Implementar las cuatro funciones de logica de negocio del modulo. El archivo no existe — `startapp` no lo genera. Es el nucleo del modulo shipments.

Imports necesarios al inicio del archivo:
```python
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.products.services import update_stock
from .models import Shipment, ShipmentProduct
```

### Funcion 1: `create_shipment(validated_data)`

**Proposito**: crear un `Shipment` completo con sus `ShipmentProduct` asociados, descontar stock de cada producto y calcular el peso y costo total. Toda la operacion es atomica.

**Parametros**: `validated_data` — diccionario con los datos validados del `ShipmentCreateSerializer`.

**Logica**:

1. Extraer la lista `products_data = validated_data.pop('products')` del diccionario antes de crear el Shipment.
2. Crear el `Shipment` con los datos restantes: `shipment = Shipment.objects.create(**validated_data)`.
3. Inicializar `total_weight = Decimal('0.000')`.
4. Iterar sobre `products_data`. Por cada elemento `{product_id, quantity}`:
   - Obtener la instancia del producto: `product = Product.objects.get(id=product_data['product_id'])`.
   - Si el producto no existe, lanzar `ValidationError`.
   - Llamar `update_stock(product, product_data['quantity'], 'DECR')` — decrementa stock y lanza `ValidationError` si no hay suficiente.
   - Crear `ShipmentProduct(shipment=shipment, product=product, quantity=product_data['quantity'], unit_price=product.unit_price)`.
   - Acumular peso: `total_weight += product.weight_kg * product_data['quantity']`.
5. Actualizar `shipment.total_weight_kg = total_weight`.
6. Llamar `calculate_shipping_cost(shipment)` — calcula y guarda `shipping_cost`.
7. Llamar `shipment.save(update_fields=['total_weight_kg', 'shipping_cost'])`.
8. Retornar `shipment`.

Todo el bloque 2–8 debe estar dentro de `with transaction.atomic():`.

**Nota critica**: al llamar `update_stock` con `'DECR'`, si cualquier producto tiene stock insuficiente la excepcion `ValidationError` hace rollback automatico del atomic block, garantizando consistencia.

### Funcion 2: `calculate_shipping_cost(shipment)`

**Proposito**: calcular el costo del envio basado en peso y cantidad de productos. Guarda el resultado en `shipment.shipping_cost`.

**Parametros**: `shipment` — instancia de `Shipment` ya guardada con `total_weight_kg` calculado.

**Formula**:
```
cantidad_productos = shipment.shipment_products.count()
shipping_cost = 50.00 + (total_weight_kg * 2.5) + (cantidad_productos * 5.0)
```

**Logica**:
1. `cantidad = shipment.shipment_products.count()`
2. `costo = Decimal('50.00') + (shipment.total_weight_kg * Decimal('2.5')) + (Decimal(cantidad) * Decimal('5.0'))`
3. `shipment.shipping_cost = costo.quantize(Decimal('0.01'))` — redondear a 2 decimales
4. No llamar `shipment.save()` dentro de esta funcion — el llamador (`create_shipment`) ya hace el save con `update_fields`. Si se llama desde otro contexto, el llamador es responsable de persistir.

**Retorna**: `Decimal` con el costo calculado. Tambien modifica `shipment.shipping_cost` en memoria.

### Funcion 3: `assign_transport(shipment, transport, driver)`

**Proposito**: asignar un transporte y conductor a un envio. Valida disponibilidad de ambos y actualiza sus estados.

**Parametros**:
- `shipment` — instancia de `Shipment`
- `transport` — instancia de `Transport`
- `driver` — instancia de `Driver`

**Logica**:
1. Validar que `transport.status == Transport.Status.AVAILABLE`. Si no, lanzar `ValidationError(f"El transporte {transport.license_plate} no esta disponible. Estado actual: {transport.status}.")`.
2. Validar que `driver.status == Driver.Status.AVAILABLE`. Si no, lanzar `ValidationError(f"El conductor {driver.user.get_full_name()} no esta disponible. Estado actual: {driver.status}.")`.
3. Dentro de `transaction.atomic()`:
   - `shipment.transport = transport`
   - `shipment.driver = driver`
   - `shipment.save(update_fields=['transport', 'driver', 'updated_at'])`
   - `transport.status = Transport.Status.IN_ROUTE`
   - `transport.save(update_fields=['status', 'updated_at'])`
   - `driver.status = Driver.Status.ON_ROUTE`
   - `driver.save(update_fields=['status', 'updated_at'])`

**Retorna**: `shipment` con los campos actualizados.

Imports adicionales necesarios:
```python
from apps.transports.models import Transport
from apps.drivers.models import Driver
from apps.products.models import Product
```

### Funcion 4: `update_shipment_status(shipment, new_status)`

**Proposito**: cambiar el estado de un envio validando que la transicion sea valida segun las reglas de negocio. Ejecuta efectos secundarios segun el estado destino.

**Parametros**:
- `shipment` — instancia de `Shipment`
- `new_status` — string con el nuevo estado (uno de los valores de `Shipment.Status`)

**Mapa de transiciones validas**:

```python
VALID_TRANSITIONS = {
    Shipment.Status.PENDING:    [Shipment.Status.PICKED_UP, Shipment.Status.CANCELLED],
    Shipment.Status.PICKED_UP:  [Shipment.Status.IN_TRANSIT],
    Shipment.Status.IN_TRANSIT: [Shipment.Status.DELIVERED, Shipment.Status.RETURNED],
    Shipment.Status.DELIVERED:  [],
    Shipment.Status.CANCELLED:  [],
    Shipment.Status.RETURNED:   [],
}
```

**Logica**:
1. Obtener `current_status = shipment.status`.
2. Si `new_status` no esta en `VALID_TRANSITIONS[current_status]`: lanzar `ValidationError(f"Transicion invalida: no se puede pasar de {current_status} a {new_status}.")`.
3. Dentro de `transaction.atomic()`:
   a. `shipment.status = new_status`
   b. Si `new_status == Shipment.Status.DELIVERED`:
      - `shipment.actual_delivery_date = timezone.now().date()`
      - Liberar transport: si `shipment.transport`, `shipment.transport.status = Transport.Status.AVAILABLE`, `shipment.transport.save(update_fields=['status', 'updated_at'])`
      - Liberar driver: si `shipment.driver`, `shipment.driver.status = Driver.Status.AVAILABLE`, `shipment.driver.save(update_fields=['status', 'updated_at'])`
   c. Si `new_status in [Shipment.Status.CANCELLED, Shipment.Status.RETURNED]`:
      - Revertir stock: iterar `shipment.shipment_products.select_related('product').all()`, llamar `update_stock(sp.product, sp.quantity, 'INCR')` por cada uno.
      - Liberar transport si asignado (igual que en DELIVERED).
      - Liberar driver si asignado (igual que en DELIVERED).
   d. `shipment.save(update_fields=['status', 'actual_delivery_date', 'updated_at'])` — usar `update_fields` siempre.
4. Retornar `shipment`.

**Dependencias**: T02.

**Criterio de aceptacion**: desde Django shell, importar `create_shipment`, `calculate_shipping_cost`, `assign_transport` y `update_shipment_status` desde `apps.shipments.services` sin errores.

---

## T05 — `apps/shipments/views.py`

**Archivo**: `apps/shipments/views.py`

**Descripcion**: Crear dos ViewSets. Reemplazar el contenido del scaffold vacio.

### `ShipmentViewSet`

- Extiende `ModelViewSet`
- `queryset`: usar `select_related` y `prefetch_related` para evitar N+1:
  ```python
  Shipment.objects.select_related(
      'customer__user',
      'origin_warehouse',
      'transport',
      'driver__user',
      'route',
  ).prefetch_related('shipment_products__product').all()
  ```
- Logica de seleccion de serializer via `get_serializer_class`:
  - Si la accion es `create` → `ShipmentCreateSerializer`
  - Si la accion es `update_status` → `ShipmentStatusUpdateSerializer`
  - En cualquier otro caso → `ShipmentSerializer`
- Sobreescribir `create` para llamar al serializer de creacion y devolver la respuesta con `ShipmentSerializer` (para que la respuesta 201 tenga el formato de lectura expandido):
  ```python
  def create(self, request, *args, **kwargs):
      serializer = self.get_serializer(data=request.data)
      serializer.is_valid(raise_exception=True)
      shipment = serializer.save()
      read_serializer = ShipmentSerializer(shipment, context={'request': request})
      return Response(read_serializer.data, status=status.HTTP_201_CREATED)
  ```
- Accion custom `update_status`:
  ```python
  @action(detail=True, methods=['post'], url_path='update-status')
  def update_status(self, request, pk=None):
      shipment = self.get_object()
      serializer = ShipmentStatusUpdateSerializer(data=request.data)
      serializer.is_valid(raise_exception=True)
      try:
          updated = update_shipment_status(shipment, serializer.validated_data['status'])
      except ValidationError as e:
          return Response({'detail': e.message}, status=status.HTTP_400_BAD_REQUEST)
      return Response(ShipmentSerializer(updated, context={'request': request}).data)
  ```

Imports necesarios en `views.py`:
```python
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from .models import Shipment, ShipmentProduct
from .serializers import (
    ShipmentSerializer,
    ShipmentCreateSerializer,
    ShipmentStatusUpdateSerializer,
    ShipmentProductSerializer,
)
from .services import update_shipment_status
```

### `ShipmentProductViewSet`

- Extiende `ModelViewSet`
- `queryset = ShipmentProduct.objects.select_related('shipment', 'product').all()`
- `serializer_class = ShipmentProductSerializer`
- Sin acciones custom
- Sin permisos custom en MVP — hereda JWT de `REST_FRAMEWORK`

**Dependencias**: T02, T03, T04.

**Criterio de aceptacion**: desde Django shell, importar `ShipmentViewSet` y `ShipmentProductViewSet` sin errores.

---

## T06 — `apps/shipments/urls.py`

**Archivo**: `apps/shipments/urls.py`

**Descripcion**: Crear el archivo de URLs registrando ambos ViewSets con `DefaultRouter`. El archivo no existe — `startapp` no lo genera.

```python
from rest_framework.routers import DefaultRouter
from .views import ShipmentViewSet, ShipmentProductViewSet

router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet)
router.register(r'shipment-products', ShipmentProductViewSet)

urlpatterns = router.urls
```

El `DefaultRouter` genera automaticamente la URL `/shipments/{id}/update-status/` para la accion custom definida con `@action(detail=True, methods=['post'], url_path='update-status')`.

URLs resultantes:

| URL generada | Metodos | Descripcion |
|---|---|---|
| `/api/v1/shipments/` | GET, POST | Listar y crear envios |
| `/api/v1/shipments/{id}/` | GET, PUT, PATCH, DELETE | Detalle, edicion y borrado |
| `/api/v1/shipments/{id}/update-status/` | POST | Cambiar estado del envio |
| `/api/v1/shipment-products/` | GET, POST | Listar y crear productos de envio |
| `/api/v1/shipment-products/{id}/` | GET, PUT, PATCH, DELETE | Detalle y edicion |

**Dependencias**: T05.

**Criterio de aceptacion**: el archivo existe y se puede importar sin errores.

---

## T07 — `apps/shipments/tests.py`

**Archivo**: `apps/shipments/tests.py`

**Descripcion**: Implementar los tests minimos del modulo. Reemplazar el contenido del scaffold vacio.

### Setup comun

Crear un `setUp` en cada clase de test que instancie las dependencias necesarias. Para crear un `Customer` y un `Driver` se necesitan instancias de `auth.User`. Usar `User.objects.create_user(...)` de `django.contrib.auth`.

Imports necesarios:
```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.suppliers.models import Supplier
from apps.products.models import Product
from apps.transports.models import Transport
from apps.drivers.models import Driver
from apps.shipments.models import Shipment, ShipmentProduct
from apps.shipments.services import (
    create_shipment,
    assign_transport,
    update_shipment_status,
)

User = get_user_model()
```

### Clase `TestShipmentModel`

Prueba el modelo `Shipment` y la generacion de `tracking_number`.

**Setup**:
- Crear `User` → `Customer`
- Crear `Warehouse`

**Casos de prueba requeridos**:

| Nombre del test | Descripcion |
|---|---|
| `test_tracking_number_auto_generado` | Al crear un `Shipment` sin especificar `tracking_number`, el campo se rellena automaticamente y sigue el formato `LOG-XXXXXXXX-YYYYMMDD` |
| `test_tracking_number_unico` | Dos envios distintos generan `tracking_number` diferentes |
| `test_status_inicial_pending` | Al crear un `Shipment`, el campo `status` por defecto es `Shipment.Status.PENDING` |
| `test_str_incluye_tracking_y_status` | `str(shipment)` incluye el `tracking_number` y el display del status |

### Clase `TestShipmentServices`

Prueba las cuatro funciones de `services.py`.

**Setup**:
- Crear `User` → `Customer`
- Crear `Warehouse`
- Crear `Supplier`
- Crear `Product` con `stock=10`, `weight_kg=Decimal('2.100')`, `unit_price=Decimal('2500.00')`
- Crear `Transport` con `status=Transport.Status.AVAILABLE`
- Crear `User` → `Driver` con `status=Driver.Status.AVAILABLE`
- Preparar `shipment_data` como diccionario compatible con `create_shipment`:
  ```python
  self.shipment_data = {
      'customer': self.customer,
      'origin_warehouse': self.warehouse,
      'destination_address': 'Av. Test 123',
      'destination_city': 'Lima',
      'destination_country': 'Peru',
      'products': [{'product_id': self.product.id, 'quantity': 3}],
  }
  ```

**Casos de prueba requeridos**:

| Nombre del test | Descripcion |
|---|---|
| `test_create_shipment_decrementa_stock` | Llamar `create_shipment` con `quantity=3` sobre un producto con `stock=10` resulta en `stock=7` despues de la llamada |
| `test_create_shipment_calcula_peso_total` | `shipment.total_weight_kg` es igual a `product.weight_kg * quantity` (ej: `2.100 * 3 = 6.300`) |
| `test_create_shipment_calcula_costo` | `shipment.shipping_cost` es el resultado de `50.00 + (6.300 * 2.5) + (1 * 5.0) = 70.75` |
| `test_create_shipment_stock_insuficiente_rollback` | Si `quantity > product.stock`, `create_shipment` lanza `ValidationError` y el stock del producto **no** cambia (rollback atomico) |
| `test_assign_transport_cambia_status_transport` | Despues de `assign_transport(shipment, transport, driver)`, `transport.status` es `IN_ROUTE` |
| `test_assign_transport_cambia_status_driver` | Despues de `assign_transport(shipment, transport, driver)`, `driver.status` es `ON_ROUTE` |
| `test_assign_transport_no_disponible_lanza_error` | Si el transporte tiene `status=IN_ROUTE`, `assign_transport` lanza `ValidationError` |
| `test_assign_driver_no_disponible_lanza_error` | Si el conductor tiene `status=ON_ROUTE`, `assign_transport` lanza `ValidationError` |
| `test_transicion_valida_pending_a_picked_up` | `update_shipment_status(shipment, 'PICKED_UP')` no lanza error y cambia el status |
| `test_transicion_invalida_lanza_error` | `update_shipment_status(shipment, 'IN_TRANSIT')` desde status `PENDING` lanza `ValidationError` |
| `test_delivered_setea_actual_delivery_date` | Al transicionar a `DELIVERED` (desde `IN_TRANSIT`), `shipment.actual_delivery_date` se setea a la fecha de hoy |
| `test_cancelled_revierte_stock` | Al transicionar a `CANCELLED` (desde `PENDING`), el stock de cada producto del envio se revierte (incrementa) |

**Nota sobre `test_cancelled_revierte_stock`**: para este test, crear primero el envio con `create_shipment` (lo que decrementa el stock), verificar que el stock bajo, luego llamar `update_shipment_status(shipment, 'CANCELLED')`, y verificar que el stock volvio al valor original.

**Nota sobre `test_delivered_setea_actual_delivery_date`**: el envio debe estar en estado `IN_TRANSIT` para poder transicionar a `DELIVERED`. Crear el envio, luego llamar `update_shipment_status(shipment, 'PICKED_UP')` y luego `update_shipment_status(shipment, 'IN_TRANSIT')` antes de la transicion final, o setear `shipment.status = 'IN_TRANSIT'` y `shipment.save()` directamente en el test para saltarse las transiciones intermedias.

**Dependencias**: T02, T04.

**Criterio de aceptacion**: `python manage.py test apps.shipments` ejecuta todos los tests sin errores de importacion ni de configuracion. Todos los tests pasan.

---

## T08 — Crear y aplicar migraciones

**Archivo**: `apps/shipments/migrations/0001_initial.py` (generado automaticamente)

**Descripcion**: Generar la migracion inicial y aplicarla.

- Ejecutar `python manage.py makemigrations apps.shipments`
  - Debe generar `apps/shipments/migrations/0001_initial.py`
  - Verificar que el archivo incluye:
    - Modelo `Shipment` con FK hacia `apps.customers.Customer`, `apps.warehouses.Warehouse`, `apps.transports.Transport`, `apps.drivers.Driver`, `apps.routes.Route` (nullable las ultimas tres)
    - Modelo `ShipmentProduct` con FK hacia `shipments.Shipment` (CASCADE) y `apps.products.Product` (PROTECT)
    - Todos los campos de `Shipment` incluyendo `tracking_number` (unique), `status` (choices, default=PENDING), `total_weight_kg` (default=0), `shipping_cost` (default=0)
    - La restriccion `unique_together` en `ShipmentProduct` para `(shipment, product)`
    - `ordering = ['-created_at']` en `Shipment.Meta`

- Ejecutar `python manage.py migrate`
  - Debe aplicar `apps.shipments.0001_initial` sin errores
  - Todas las tablas referenciadas deben existir previamente

**Dependencias**: T01, T02. Todas las migraciones de fases 1–8 deben estar aplicadas.

**Criterio de aceptacion**: `python manage.py migrate --check` retorna sin pendientes. Las tablas `shipments_shipment` y `shipments_shipmentproduct` existen en la base de datos.

---

## T09 — Incluir en `config/urls.py`

**Archivo**: `config/urls.py`

**Descripcion**: Registrar las URLs de `apps.shipments` en el router principal del proyecto.

Abrir `config/urls.py` y agregar el `include` de `apps.shipments.urls` a continuacion de `apps.routes.urls`:

```python
path('api/v1/', include('apps.routes.urls')),
path('api/v1/', include('apps.shipments.urls')),   # <- agregar aqui
```

El archivo completo debe quedar:

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
    path('api/v1/', include('apps.warehouses.urls')),
    path('api/v1/', include('apps.suppliers.urls')),
    path('api/v1/', include('apps.customers.urls')),
    path('api/v1/', include('apps.drivers.urls')),
    path('api/v1/', include('apps.transports.urls')),
    path('api/v1/', include('apps.products.urls')),
    path('api/v1/', include('apps.routes.urls')),
    path('api/v1/', include('apps.shipments.urls')),
]
```

**Dependencias**: T06, T08.

**Criterio de aceptacion**: `python manage.py check` no reporta errores de URL. `GET /api/v1/shipments/` retorna `401` sin token JWT (confirma que la URL esta registrada).

---

## T10 — Verificacion integral de la Fase 9

**Archivo**: ninguno — tarea de verificacion.

**Descripcion**: Validar que toda la implementacion esta correcta y funcionando.

- `python manage.py check` retorna "System check identified no issues"
- `python manage.py migrate --check` retorna sin pendientes
- Desde Django shell:
  - `from apps.shipments.models import Shipment, ShipmentProduct` — sin errores
  - `from apps.shipments.serializers import ShipmentSerializer, ShipmentCreateSerializer, ShipmentProductSerializer, ShipmentStatusUpdateSerializer` — sin errores
  - `from apps.shipments.services import create_shipment, calculate_shipping_cost, assign_transport, update_shipment_status` — sin errores
  - `from apps.shipments.views import ShipmentViewSet, ShipmentProductViewSet` — sin errores
  - `print(Shipment._meta.fields)` — muestra todos los campos incluyendo `tracking_number`, `status`, `total_weight_kg`, `shipping_cost`
  - `print(ShipmentProduct._meta.unique_together)` — muestra `(('shipment', 'product'),)`
- `python manage.py test apps.shipments` — todos los tests de `TestShipmentModel` y `TestShipmentServices` pasan
- Con el servidor activo (iniciado manualmente por el usuario):
  - `GET /api/v1/shipments/` retorna `401` sin token y `200` con token valido
  - `GET /api/v1/shipment-products/` retorna `401` sin token y `200` con token valido
  - `POST /api/v1/shipments/` con body valido crea el envio, devuelve `201` con `tracking_number` generado, `status=PENDING`, `total_weight_kg` y `shipping_cost` calculados
  - `POST /api/v1/shipments/{id}/update-status/` con `{"status": "PICKED_UP"}` cambia el estado (desde PENDING)
  - `POST /api/v1/shipments/{id}/update-status/` con una transicion invalida retorna `400` con mensaje descriptivo

**Dependencias**: T01 a T09 completados.

**Criterio de aceptacion**: todos los checks pasan, todos los tests pasan, el endpoint de creacion funciona correctamente con un caso real de extremo a extremo.

---

## Endpoints resultantes

### Envios (`Shipment`)

| Metodo | URL | Descripcion | Body requerido |
|---|---|---|---|
| GET | `/api/v1/shipments/` | Listar todos los envios (paginado) | — |
| POST | `/api/v1/shipments/` | Crear un envio nuevo | Ver body de creacion abajo |
| GET | `/api/v1/shipments/{id}/` | Obtener un envio por ID | — |
| PUT | `/api/v1/shipments/{id}/` | Actualizar todos los campos | — |
| PATCH | `/api/v1/shipments/{id}/` | Actualizar campos parcialmente | — |
| DELETE | `/api/v1/shipments/{id}/` | Eliminar un envio | — |
| POST | `/api/v1/shipments/{id}/update-status/` | Cambiar estado del envio | `{"status": "PICKED_UP"}` |

### Productos de envio (`ShipmentProduct`)

| Metodo | URL | Descripcion |
|---|---|---|
| GET | `/api/v1/shipment-products/` | Listar todos los shipment products |
| POST | `/api/v1/shipment-products/` | Agregar un producto a un envio |
| GET | `/api/v1/shipment-products/{id}/` | Detalle de un shipment product |
| PUT/PATCH | `/api/v1/shipment-products/{id}/` | Actualizar quantity |
| DELETE | `/api/v1/shipment-products/{id}/` | Quitar producto del envio |

Todos los endpoints requieren header:
```
Authorization: Bearer <access_token>
```

**Ejemplo de body para POST `/api/v1/shipments/`:**
```json
{
  "customer": 1,
  "origin_warehouse": 2,
  "destination_address": "Av. Larco 1234, Miraflores",
  "destination_city": "Lima",
  "destination_country": "Peru",
  "estimated_delivery_date": "2026-06-01",
  "notes": "Entregar en horario de oficina",
  "products": [
    {"product_id": 1, "quantity": 3},
    {"product_id": 4, "quantity": 1}
  ]
}
```

**Ejemplo de body para POST `/api/v1/shipments/{id}/update-status/`:**
```json
{
  "status": "PICKED_UP"
}
```

---

## Validaciones de negocio

### `create_shipment`

- La lista `products` no puede estar vacia — `ValidationError` si `len == 0`
- Cada `product_id` debe referenciar un `Product` existente y activo — `ValidationError` si no
- `quantity` debe ser mayor que 0 — `ValidationError` si <= 0
- El stock de cada producto debe ser suficiente — `ValidationError` de `update_stock` si no alcanza
- Si cualquier validacion falla, la transaccion hace rollback completo (no queda ningun ShipmentProduct creado ni stock modificado)

### `assign_transport`

- `transport.status` debe ser `AVAILABLE` — `ValidationError` si no
- `driver.status` debe ser `AVAILABLE` — `ValidationError` si no

### `update_shipment_status`

Transiciones validas:

```
PENDING    → PICKED_UP    ✓
PENDING    → CANCELLED    ✓
PICKED_UP  → IN_TRANSIT   ✓
IN_TRANSIT → DELIVERED    ✓
IN_TRANSIT → RETURNED     ✓
DELIVERED  → (ninguna)    ✗ estado terminal
CANCELLED  → (ninguna)    ✗ estado terminal
RETURNED   → (ninguna)    ✗ estado terminal
```

Cualquier otra transicion lanza `ValidationError`.

---

## Notas al Implement Agent

1. **Ejecutar `startapp` antes de cualquier otra tarea**: el directorio `apps/shipments/` no existe. El comando es `python manage.py startapp shipments apps/shipments` (con el prefijo de directorio).

2. **`name = 'apps.shipments'` en `apps.py` es obligatorio**: Django usa este valor para construir el label de la app en FK de migraciones. Si se deja como `'shipments'`, las migraciones generaran referencias incorrectas.

3. **`tracking_number` se genera en `save()`, no en el service**: la logica de generacion vive en el modelo para garantizar que cualquier codigo que cree un `Shipment` directamente (incluyendo el admin de Django) genere el numero automaticamente.

4. **`transaction.atomic()` en `create_shipment` es critico**: si el stock de cualquier producto es insuficiente, la excepcion `ValidationError` lanzada por `update_stock` hace rollback de todo — el `Shipment`, todos los `ShipmentProduct` creados hasta ese punto y todos los decrementos de stock anteriores. Sin atomic, quedarian datos inconsistentes.

5. **`select_related('customer__user', 'driver__user')` es necesario**: el `CustomerSummarySerializer` y el `DriverSummarySerializer` acceden a `instance.user.get_full_name()`. Sin `select_related`, cada objeto en el listado genera queries adicionales (N+1).

6. **`ShipmentCreateSerializer.create` llama a `create_shipment` del service**: el serializer no implementa logica de negocio directamente. Delega al service y retorna la instancia. El `ShipmentViewSet.create` luego usa `ShipmentSerializer` para serializar la respuesta (formato expandido en el 201).

7. **La accion custom `update_status` captura `ValidationError` de Django**: las funciones de servicio lanzan `django.core.exceptions.ValidationError`, no `rest_framework.exceptions.ValidationError`. La vista debe capturarla explicitamente y convertirla a una `Response` con `status=400` y el mensaje en `{'detail': ...}`.

8. **`calculate_shipping_cost` NO llama `shipment.save()`**: la funcion solo calcula y asigna `shipment.shipping_cost` en memoria. El llamador (`create_shipment`) hace el save con `update_fields`. Esto evita saves duplicados y permite que la funcion sea testeada sin efectos secundarios.

9. **`unique_together = [['shipment', 'product']]` en `ShipmentProduct.Meta`**: garantiza que un producto no aparezca dos veces en el mismo envio. Si se intenta crear un `ShipmentProduct` duplicado, DRF retorna `400` automaticamente.

10. **Tests de `TestShipmentServices` requieren el modelo `Product` con `weight_kg`**: al calcular `total_weight_kg`, el service accede a `product.weight_kg`. Asegurarse de que el producto creado en `setUp` tenga un `weight_kg` con valor conocido (ej: `Decimal('2.100')`) para poder verificar el calculo.

11. **`config/urls.py` actualmente tiene siete lineas de `include`**: agregar la de `apps.shipments.urls` al final. No reemplazar ninguna linea existente.

12. **La formula de costo es deliberadamente simple**: `50.00 + (peso_total * 2.5) + (num_productos * 5.0)`. No agregar logica de recargo por tipo de transporte aunque el schema tenga el campo `type` en `Transport` — el MVP usa esta formula fija. El campo `base_cost` del schema original no se implementa como campo separado; `shipping_cost` cubre el costo total calculado.

13. **Los estados terminales no tienen transiciones salientes**: `DELIVERED`, `CANCELLED` y `RETURNED` no pueden transicionar a ningun otro estado. El mapa `VALID_TRANSITIONS` debe tener listas vacias para estos tres estados, y cualquier intento de transicion desde ellos debe lanzar `ValidationError`.
