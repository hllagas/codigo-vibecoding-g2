# Spec: shipments — Phase 8

## Contexto

La app `shipments` es la unidad central de negocio. Gestiona envíos de productos desde un almacén hasta un cliente, con seguimiento de estado. Contiene dos modelos: `Shipment` y `ShipmentItem`. Los ítems se crean de forma anidada en la misma request del envío. Incluye una acción custom `PATCH /shipments/{id}/status/` que valida las transiciones de estado.

Esta es la última app del MVP.

---

## Dependencias

- **`customers`** (Phase 2): FK de `Shipment` hacia `Customer`.
- **`warehouses`** (Phase 2): FK de `Shipment` hacia `Warehouse`.
- **`routes`** (Phase 7): FK nullable de `Shipment` hacia `Route`.
- **`products`** (Phase 3): FK de `ShipmentItem` hacia `Product`.

---

## Tareas

### TASK-01 — Crear app Django `shipments` dentro de `apps/`

```
python manage.py startapp shipments apps/shipments
```

Actualizar `apps/shipments/apps.py`:

```
name = 'apps.shipments'
```

---

### TASK-02 — Crear modelos `Shipment` y `ShipmentItem`

En `apps/shipments/models.py`:

#### `ShipmentStatus` (TextChoices)

| Constante | Valor DB | Label |
|---|---|---|
| `PENDING` | `'pending'` | `'Pendiente'` |
| `PROCESSING` | `'processing'` | `'En procesamiento'` |
| `IN_TRANSIT` | `'in_transit'` | `'En tránsito'` |
| `DELIVERED` | `'delivered'` | `'Entregado'` |
| `CANCELLED` | `'cancelled'` | `'Cancelado'` |
| `RETURNED` | `'returned'` | `'Devuelto'` |

#### Modelo `Shipment`

| Campo | Tipo Django | Detalles |
|---|---|---|
| `tracking_number` | `CharField` | `max_length=50`, `unique=True`, `null=False` |
| `customer` | `ForeignKey` | `'customers.Customer'`, `on_delete=PROTECT`, `related_name='shipments'` |
| `origin_warehouse` | `ForeignKey` | `'warehouses.Warehouse'`, `on_delete=PROTECT`, `related_name='shipments'` |
| `route` | `ForeignKey` | `'routes.Route'`, `on_delete=SET_NULL`, `null=True`, `blank=True`, `related_name='shipments'` |
| `destination_address` | `TextField` | `null=False` |
| `destination_city` | `CharField` | `max_length=100`, `null=False` |
| `destination_country` | `CharField` | `max_length=100`, `null=False` |
| `status` | `CharField` | `max_length=20`, `choices=ShipmentStatus.choices`, `default=ShipmentStatus.PENDING` |
| `scheduled_delivery_date` | `DateField` | `null=False` |
| `actual_delivery_date` | `DateField` | `null=True`, `blank=True` |
| `total_weight_kg` | `DecimalField` | `max_digits=8`, `decimal_places=2`, `null=False` |
| `notes` | `TextField` | `null=True`, `blank=True` |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

`Meta`: `db_table = 'shipments'`, `ordering = ['-created_at']`

`on_delete=PROTECT` en `customer` y `origin_warehouse` — no se puede eliminar un cliente o almacén con envíos activos.
`on_delete=SET_NULL` en `route` — el envío puede existir sin ruta asignada (se asigna al despachar).

#### Modelo `ShipmentItem`

| Campo | Tipo Django | Detalles |
|---|---|---|
| `shipment` | `ForeignKey` | `Shipment`, `on_delete=CASCADE`, `related_name='items'` |
| `product` | `ForeignKey` | `'products.Product'`, `on_delete=PROTECT`, `related_name='shipment_items'` |
| `quantity` | `IntegerField` | `null=False` |
| `unit_price_at_shipment` | `DecimalField` | `max_digits=10`, `decimal_places=2`, `null=False` |

`Meta`: `db_table = 'shipment_items'`, `unique_together = [('shipment', 'product')]`

`on_delete=PROTECT` en `product` — no se puede eliminar un producto incluido en envíos históricos.

```python
from django.db import models


class ShipmentStatus(models.TextChoices):
    PENDING = 'pending', 'Pendiente'
    PROCESSING = 'processing', 'En procesamiento'
    IN_TRANSIT = 'in_transit', 'En tránsito'
    DELIVERED = 'delivered', 'Entregado'
    CANCELLED = 'cancelled', 'Cancelado'
    RETURNED = 'returned', 'Devuelto'


VALID_TRANSITIONS = {
    'pending': ['processing', 'cancelled'],
    'processing': ['in_transit', 'cancelled'],
    'in_transit': ['delivered', 'returned'],
    'delivered': [],
    'cancelled': [],
    'returned': [],
}


class Shipment(models.Model):
    tracking_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.PROTECT,
        related_name='shipments',
    )
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
        related_name='shipments',
    )
    route = models.ForeignKey(
        'routes.Route',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments',
    )
    destination_address = models.TextField()
    destination_city = models.CharField(max_length=100)
    destination_country = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.PENDING,
    )
    scheduled_delivery_date = models.DateField()
    actual_delivery_date = models.DateField(null=True, blank=True)
    total_weight_kg = models.DecimalField(max_digits=8, decimal_places=2)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tracking_number} [{self.status}]"


class ShipmentItem(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='shipment_items',
    )
    quantity = models.IntegerField()
    unit_price_at_shipment = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'shipment_items'
        unique_together = [('shipment', 'product')]
```

`VALID_TRANSITIONS` se define en `models.py` como constante del módulo para que tanto la vista como los tests puedan importarlo directamente.

---

### TASK-03 — Crear serializers

En `apps/shipments/serializers.py`:

```python
from rest_framework import serializers
from .models import Shipment, ShipmentItem, VALID_TRANSITIONS


class ShipmentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentItem
        fields = '__all__'
        read_only_fields = ['id', 'shipment']


class ShipmentSerializer(serializers.ModelSerializer):
    items = ShipmentItemSerializer(many=True, required=False)

    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_items(self, items):
        product_ids = [item['product'].id for item in items]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError('No puede haber dos ítems con el mismo producto.')
        return items

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        shipment = Shipment.objects.create(**validated_data)
        for item_data in items_data:
            ShipmentItem.objects.create(shipment=shipment, **item_data)
        return shipment

    def update(self, instance, validated_data):
        validated_data.pop('items', None)
        return super().update(instance, validated_data)


class ShipmentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=list(VALID_TRANSITIONS.keys()))
```

`ShipmentStatusSerializer` valida que el nuevo estado sea un valor del enum antes de llegar a la lógica de transición.

`update()` descarta `items` — los ítems no se modifican vía PUT/PATCH del envío en el MVP.

---

### TASK-04 — Crear ViewSet `ShipmentViewSet`

En `apps/shipments/views.py`:

```python
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import VALID_TRANSITIONS, Shipment
from .serializers import ShipmentSerializer, ShipmentStatusSerializer


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.select_related(
        'customer', 'origin_warehouse', 'route'
    ).prefetch_related('items__product').all()
    serializer_class = ShipmentSerializer
    filterset_fields = ['status', 'customer', 'origin_warehouse', 'route']
    search_fields = ['tracking_number', 'destination_city', 'destination_country']
    ordering_fields = ['scheduled_delivery_date', 'created_at', 'status']

    @action(methods=['patch'], detail=True, url_path='status')
    def update_status(self, request, pk=None):
        shipment = self.get_object()
        serializer = ShipmentStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        new_status = serializer.validated_data['status']
        allowed = VALID_TRANSITIONS.get(shipment.status, [])
        if new_status not in allowed:
            return Response(
                {'status': f"Transición de '{shipment.status}' a '{new_status}' no está permitida."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        shipment.status = new_status
        shipment.save(update_fields=['status', 'updated_at'])
        return Response(ShipmentSerializer(shipment).data)
```

---

### TASK-05 — Crear `apps/shipments/urls.py`

```python
from rest_framework.routers import DefaultRouter
from .views import ShipmentViewSet

router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet)

urlpatterns = router.urls
```

Endpoints:
- `GET/POST /api/v1/shipments/`
- `GET/PUT/PATCH/DELETE /api/v1/shipments/{id}/`
- `PATCH /api/v1/shipments/{id}/status/`

---

### TASK-06 — Registrar en `INSTALLED_APPS`

Agregar `'apps.shipments'` después de `'apps.routes'` en `config/settings.py`.

---

### TASK-07 — Incluir URLs en `config/urls.py`

```python
path('', include('apps.shipments.urls')),
```

---

### TASK-08 — Crear migración y aplicarla

```
python manage.py makemigrations shipments
python manage.py migrate
```

---

### TASK-09 — Escribir tests

En `apps/shipments/tests.py`:

#### `ShipmentModelTest`
- Crear `Shipment` con campos requeridos.
- `status` es `'pending'` por defecto.
- `tracking_number` es único.
- `route` admite `null`.
- Crear `ShipmentItem` con `shipment`, `product`, `quantity`, `unit_price_at_shipment`.
- `unique_together (shipment, product)` — mismo producto dos veces en el mismo envío → `IntegrityError`.
- Eliminar `Shipment` → sus `ShipmentItem` se eliminan (CASCADE).

#### `ShipmentViewSetTest`
- `POST /api/v1/shipments/` sin ítems → 201.
- `POST /api/v1/shipments/` con ítems anidados → 201, ítems creados.
- `POST /api/v1/shipments/` `tracking_number` duplicado → 400.
- `POST /api/v1/shipments/` campos requeridos ausentes → 400.
- `POST /api/v1/shipments/` dos ítems con el mismo producto → 400.
- `GET /api/v1/shipments/` → 200.
- `GET /api/v1/shipments/?status=pending` → 200.
- `GET /api/v1/shipments/{id}/` → 200 con `items` en la respuesta.
- `GET /api/v1/shipments/99999/` → 404.
- `PATCH /api/v1/shipments/{id}/` → 200.
- `DELETE /api/v1/shipments/{id}/` → 204.
- `PATCH /api/v1/shipments/{id}/status/` transición válida (`pending` → `processing`) → 200.
- `PATCH /api/v1/shipments/{id}/status/` transición inválida (`pending` → `delivered`) → 400.
- `PATCH /api/v1/shipments/{id}/status/` estado desconocido → 400.
- Sin autenticación → 401.

---

## Decisiones de diseño

### Ítems anidados en creación, no en actualización

`create()` sobreescrito acepta `items` anidados. `update()` descarta `items` — modificar ítems de un envío existente no es parte del MVP (requeriría lógica de inventario).

### `unit_price_at_shipment` siempre explícito

El cliente debe enviar el precio vigente al crear el ítem. No se copia automáticamente desde `product.unit_price` — esa decisión pertenece al dominio de negocio, no a la API.

### `VALID_TRANSITIONS` en `models.py`

Se define como constante del módulo (no en la vista) para que sea importable en tests sin necesidad de instanciar la vista.

### `on_delete=SET_NULL` en FK a Route

El envío puede existir sin ruta (estado `pending`). La ruta se asigna cuando el envío pasa a `processing` o `in_transit`. Si la ruta se elimina, el envío queda sin ruta pero no desaparece.

---

## Criterios de aceptación

1. `python manage.py makemigrations shipments` genera migración sin errores.
2. `python manage.py migrate` crea tablas `shipments` y `shipment_items`.
3. `GET /api/v1/shipments/` → 200 autenticado.
4. `GET /api/v1/shipments/` → 401 sin token.
5. `POST` con campos requeridos → 201 con `status='pending'` y `items: []`.
6. `POST` con `items` anidados → 201, ítems incluidos en la respuesta.
7. `POST` con `tracking_number` duplicado → 400.
8. `POST` con dos ítems con el mismo producto → 400.
9. `?status=pending` filtra envíos por estado.
10. `PATCH /shipments/{id}/status/` con `{"status": "processing"}` desde `pending` → 200.
11. `PATCH /shipments/{id}/status/` con `{"status": "delivered"}` desde `pending` → 400.
12. `PATCH /shipments/{id}/status/` con `{"status": "flying"}` → 400.
13. Eliminar `Shipment` → sus `ShipmentItem` se eliminan (CASCADE).
14. `python manage.py test` ejecuta todos los tests sin fallos.
15. `GET /api/docs/` refleja endpoints de `shipments` incluida la acción `status`.
