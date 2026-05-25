# Spec: routes — Phase 7

## Contexto

La app `routes` gestiona los trayectos de los transportes. Contiene dos modelos: `Route` (la ruta en sí) y `RouteStop` (las paradas ordenadas de esa ruta). Ambos modelos viven en la misma app. Esta app es prerequisito de `shipments` (Phase 8), que referencia `Route` mediante FK nullable.

Los endpoints de paradas son acciones anidadas bajo `/routes/{id}/stops/`, no una app separada.

---

## Dependencias

- **`transports`** (Phase 6): FK de `Route` hacia `Transport`.
- **`warehouses`** (Phase 2): FK de `Route` hacia `Warehouse` como almacén de origen.
- No se crea ninguna app nueva para `route_stops` — el modelo vive en `apps/routes/`.

---

## Tareas

### TASK-01 — Crear app Django `routes` dentro de `apps/`

Ejecutar desde la raíz del proyecto:

```
python manage.py startapp routes apps/routes
```

Luego actualizar `apps/routes/apps.py`:

```
name = 'apps.routes'
```

---

### TASK-02 — Crear modelos `Route` y `RouteStop`

En `apps/routes/models.py`, definir ambos modelos:

#### `RouteStatus` (TextChoices)

| Constante | Valor DB | Label |
|---|---|---|
| `PLANNED` | `'planned'` | `'Planificada'` |
| `IN_PROGRESS` | `'in_progress'` | `'En progreso'` |
| `COMPLETED` | `'completed'` | `'Completada'` |
| `CANCELLED` | `'cancelled'` | `'Cancelada'` |

#### Modelo `Route`

| Campo | Tipo Django | Detalles |
|---|---|---|
| `name` | `CharField` | `max_length=255`, `null=False` |
| `origin_warehouse` | `ForeignKey` | `'warehouses.Warehouse'`, `on_delete=PROTECT`, `related_name='routes'` |
| `transport` | `ForeignKey` | `'transports.Transport'`, `on_delete=PROTECT`, `related_name='routes'` |
| `status` | `CharField` | `max_length=20`, `choices=RouteStatus.choices`, `default=RouteStatus.PLANNED` |
| `estimated_duration_hours` | `DecimalField` | `max_digits=5`, `decimal_places=2`, `null=True`, `blank=True` |
| `started_at` | `DateTimeField` | `null=True`, `blank=True` |
| `completed_at` | `DateTimeField` | `null=True`, `blank=True` |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

`Meta`: `db_table = 'routes'`, `ordering = ['-created_at']`

`on_delete=PROTECT` en ambas FKs: no se puede eliminar un almacén o transporte si tiene rutas asociadas. La integridad operativa lo requiere.

#### Modelo `RouteStop`

| Campo | Tipo Django | Detalles |
|---|---|---|
| `route` | `ForeignKey` | `Route`, `on_delete=CASCADE`, `related_name='stops'` |
| `stop_order` | `IntegerField` | `null=False` — posición en la secuencia (1, 2, 3...) |
| `address` | `TextField` | `null=False` |
| `city` | `CharField` | `max_length=100`, `null=False` |
| `latitude` | `DecimalField` | `max_digits=9`, `decimal_places=6`, `null=True`, `blank=True` |
| `longitude` | `DecimalField` | `max_digits=9`, `decimal_places=6`, `null=True`, `blank=True` |
| `estimated_arrival` | `DateTimeField` | `null=True`, `blank=True` |
| `actual_arrival` | `DateTimeField` | `null=True`, `blank=True` |

`Meta`:
- `db_table = 'route_stops'`
- `ordering = ['stop_order']`
- `unique_together = [('route', 'stop_order')]`

Código completo:

```python
from django.db import models


class RouteStatus(models.TextChoices):
    PLANNED = 'planned', 'Planificada'
    IN_PROGRESS = 'in_progress', 'En progreso'
    COMPLETED = 'completed', 'Completada'
    CANCELLED = 'cancelled', 'Cancelada'


class Route(models.Model):
    name = models.CharField(max_length=255)
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
        related_name='routes',
    )
    transport = models.ForeignKey(
        'transports.Transport',
        on_delete=models.PROTECT,
        related_name='routes',
    )
    status = models.CharField(
        max_length=20,
        choices=RouteStatus.choices,
        default=RouteStatus.PLANNED,
    )
    estimated_duration_hours = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'routes'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} [{self.status}]"


class RouteStop(models.Model):
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='stops',
    )
    stop_order = models.IntegerField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    estimated_arrival = models.DateTimeField(null=True, blank=True)
    actual_arrival = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'route_stops'
        ordering = ['stop_order']
        unique_together = [('route', 'stop_order')]
```

---

### TASK-03 — Crear serializers

En `apps/routes/serializers.py`, definir dos serializers:

```python
from rest_framework import serializers
from .models import Route, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = '__all__'
        read_only_fields = ['id', 'route']


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
```

`route` es `read_only` en `RouteStopSerializer` porque siempre se infiere del URL (`/routes/{id}/stops/`), nunca del body del request.

---

### TASK-04 — Crear ViewSet `RouteViewSet` con acciones de paradas

En `apps/routes/views.py`, definir `RouteViewSet` con `ModelViewSet` base más dos acciones `@action` para gestionar paradas anidadas:

```python
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Route, RouteStop
from .serializers import RouteSerializer, RouteStopSerializer


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.select_related('origin_warehouse', 'transport').all()
    serializer_class = RouteSerializer
    filterset_fields = ['status', 'transport', 'origin_warehouse']
    search_fields = ['name']
    ordering_fields = ['name', 'status', 'created_at', 'started_at']

    @action(methods=['get', 'post'], detail=True, url_path='stops')
    def stops(self, request, pk=None):
        route = self.get_object()
        if request.method == 'GET':
            stops = RouteStop.objects.filter(route=route).order_by('stop_order')
            serializer = RouteStopSerializer(stops, many=True)
            return Response(serializer.data)
        serializer = RouteStopSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(route=route)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        methods=['get', 'put', 'patch', 'delete'],
        detail=True,
        url_path=r'stops/(?P<stop_id>[^/.]+)',
    )
    def stop_detail(self, request, pk=None, stop_id=None):
        route = self.get_object()
        stop = get_object_or_404(RouteStop, id=stop_id, route=route)
        if request.method == 'GET':
            return Response(RouteStopSerializer(stop).data)
        if request.method == 'DELETE':
            stop.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        partial = request.method == 'PATCH'
        serializer = RouteStopSerializer(stop, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

---

### TASK-05 — Crear `apps/routes/urls.py`

```python
from rest_framework.routers import DefaultRouter
from .views import RouteViewSet

router = DefaultRouter()
router.register(r'routes', RouteViewSet)

urlpatterns = router.urls
```

Endpoints generados:
- `GET/POST /api/v1/routes/`
- `GET/PUT/PATCH/DELETE /api/v1/routes/{id}/`
- `GET/POST /api/v1/routes/{id}/stops/`
- `GET/PUT/PATCH/DELETE /api/v1/routes/{id}/stops/{stop_id}/`

---

### TASK-06 — Registrar en `INSTALLED_APPS`

Agregar `'apps.routes'` después de `'apps.transports'` en `config/settings.py`.

---

### TASK-07 — Incluir URLs en `config/urls.py`

```python
path('', include('apps.routes.urls')),
```

---

### TASK-08 — Crear migración y aplicarla

```
python manage.py makemigrations routes
python manage.py migrate
```

Verificar que se crean las tablas `routes` y `route_stops` con el unique constraint `(route_id, stop_order)`.

---

### TASK-09 — Escribir tests

En `apps/routes/tests.py`:

#### `RouteModelTest`
- Crear `Route` con los campos requeridos.
- `status` es `'planned'` por defecto.
- Crear `RouteStop` con `route`, `stop_order`, `address`, `city`.
- `unique_together` (`route`, `stop_order`): dos paradas con el mismo orden en la misma ruta → `IntegrityError`.
- Al eliminar `Route`, sus `RouteStop` se eliminan (CASCADE).

#### `RouteViewSetTest`
- `POST /api/v1/routes/` — creación exitosa (201).
- `POST /api/v1/routes/` — datos inválidos (400).
- `GET /api/v1/routes/` — listado (200).
- `GET /api/v1/routes/?status=planned` — filtrado por estado (200).
- `GET /api/v1/routes/{id}/` — detalle (200).
- `GET /api/v1/routes/{id}/` — no encontrado (404).
- `PATCH /api/v1/routes/{id}/` — actualización parcial (200).
- `DELETE /api/v1/routes/{id}/` — eliminación (204).
- `GET /api/v1/routes/{id}/stops/` — lista vacía cuando no hay paradas (200, `[]`).
- `POST /api/v1/routes/{id}/stops/` — crear parada (201).
- `POST /api/v1/routes/{id}/stops/` — `stop_order` duplicado en misma ruta → 400.
- `GET /api/v1/routes/{id}/stops/{stop_id}/` — detalle de parada (200).
- `PATCH /api/v1/routes/{id}/stops/{stop_id}/` — actualizar parada (200).
- `DELETE /api/v1/routes/{id}/stops/{stop_id}/` — eliminar parada (204).
- `GET /api/v1/routes/{id}/stops/{stop_id}/` con `stop_id` inexistente → 404.
- Request sin autenticación → 401.

---

## Decisiones de diseño

### PROTECT en FKs a Warehouse y Transport

`on_delete=PROTECT` en `origin_warehouse` y `transport`. Un almacén o transporte referenciado en una ruta activa no debe poder eliminarse. Forzar la desasignación explícita antes del borrado protege la integridad operativa.

### Paradas como acciones anidadas, no app separada

`route_stops` no tiene sus propias URLs de primer nivel. Las paradas solo tienen sentido en el contexto de una ruta, por lo que el acceso siempre es a través de `/routes/{id}/stops/`. Usar `@action` en lugar de un `SimpleRouter` anidado evita dependencias extra y mantiene el código en una sola app.

### `route` read_only en `RouteStopSerializer`

Las paradas se crean siempre bajo una ruta específica (determinada por el URL). El campo `route` no debe enviarse en el body: se inyecta automáticamente con `serializer.save(route=route)`.

---

## Criterios de aceptación

1. `python manage.py makemigrations routes` genera migración sin errores.
2. `python manage.py migrate` crea tablas `routes` y `route_stops`.
3. `GET /api/v1/routes/` → 200 autenticado.
4. `GET /api/v1/routes/` → 401 sin token.
5. `POST /api/v1/routes/` con `name`, `origin_warehouse`, `transport` → 201 con `status='planned'`.
6. `?status=planned` filtra rutas por estado.
7. `GET /api/v1/routes/{id}/stops/` → 200 con lista vacía `[]` cuando no hay paradas.
8. `POST /api/v1/routes/{id}/stops/` con `stop_order`, `address`, `city` → 201.
9. `POST` con `stop_order` duplicado en misma ruta → 400.
10. `GET /api/v1/routes/{id}/stops/{stop_id}/` → 200.
11. `DELETE /api/v1/routes/{id}/stops/{stop_id}/` → 204.
12. `GET /api/v1/routes/{id}/stops/999/` → 404.
13. Eliminar `Route` elimina sus `RouteStop` (CASCADE).
14. `python manage.py test` ejecuta todos los tests sin fallos.
15. `GET /api/docs/` refleja rutas y acciones `stops`.
