# Spec: transports — Phase 6

## Contexto

La app `transports` gestiona los vehículos disponibles para realizar envíos. Cada transporte puede tener un conductor asignado (FK nullable a `drivers`). El campo `transport_type` es un enum implementado con `TextChoices`. Esta app es prerequisito de `routes` (Phase 7), que referencia `Transport` mediante FK.

---

## Dependencias

- **`drivers`** (Phase 5): el modelo `Transport` tiene FK nullable a `Driver`. La app `drivers` debe estar migrada antes de ejecutar la migración de esta fase.
- Requiere el setup base de Phase 1: Django, DRF, `django-filter`, `drf-spectacular`, configuración JWT en `settings.py`.

---

## Tareas

### TASK-01 — Crear app Django `transports` dentro de `apps/`

Ejecutar desde la raíz del proyecto:

```
python manage.py startapp transports apps/transports
```

Luego actualizar `apps/transports/apps.py` y cambiar el campo `name` a:

```
name = 'apps.transports'
```

---

### TASK-02 — Crear modelo `Transport` con enum `TransportType`

En `apps/transports/models.py`, definir primero la clase `TransportType` como `TextChoices`:

| Constante | Valor DB | Label |
|---|---|---|
| `TRUCK` | `'truck'` | `'Camión'` |
| `VAN` | `'van'` | `'Furgoneta'` |
| `MOTORCYCLE` | `'motorcycle'` | `'Motocicleta'` |
| `BICYCLE` | `'bicycle'` | `'Bicicleta'` |

Luego definir el modelo `Transport` con exactamente los siguientes campos según `database-schema.md`:

| Campo | Tipo Django | Detalles |
|---|---|---|
| `name` | `CharField` | `max_length=255`, `null=False` |
| `plate_number` | `CharField` | `max_length=20`, `unique=True`, `null=False` |
| `transport_type` | `CharField` | `max_length=20`, `choices=TransportType.choices`, `null=False` |
| `capacity_kg` | `DecimalField` | `max_digits=8`, `decimal_places=2`, `null=False` |
| `driver` | `ForeignKey` | hacia `'drivers.Driver'`, `on_delete=SET_NULL`, `null=True`, `blank=True`, `related_name='transports'` — se almacena como `driver_id` |
| `is_active` | `BooleanField` | `default=True` |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

La clase `Meta` debe definir:
- `db_table = 'transports'`
- `ordering = ['name']`

Nota sobre `on_delete=SET_NULL`: si un conductor es eliminado, el transporte debe quedar sin conductor asignado (no eliminarse). Esto preserva el registro del vehículo aunque el conductor ya no exista.

```python
from django.db import models


class TransportType(models.TextChoices):
    TRUCK = 'truck', 'Camión'
    VAN = 'van', 'Furgoneta'
    MOTORCYCLE = 'motorcycle', 'Motocicleta'
    BICYCLE = 'bicycle', 'Bicicleta'


class Transport(models.Model):
    name = models.CharField(max_length=255)
    plate_number = models.CharField(max_length=20, unique=True)
    transport_type = models.CharField(max_length=20, choices=TransportType.choices)
    capacity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    driver = models.ForeignKey(
        'drivers.Driver',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transports',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transports'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.plate_number})"
```

---

### TASK-03 — Crear serializer `TransportSerializer`

En `apps/transports/serializers.py`, definir un `ModelSerializer` para el modelo `Transport`.

Incluir un serializer anidado de solo lectura `DriverReadSerializer` para exponer datos del conductor en las respuestas, manteniendo `driver` (FK entero nullable) para escritura.

```python
from rest_framework import serializers
from .models import Transport


class DriverReadSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    license_number = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)


class TransportSerializer(serializers.ModelSerializer):
    driver_detail = DriverReadSerializer(source='driver', read_only=True)

    class Meta:
        model = Transport
        fields = [
            'id',
            'name',
            'plate_number',
            'transport_type',
            'capacity_kg',
            'driver',
            'driver_detail',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'driver_detail', 'created_at', 'updated_at']
```

`driver` (int nullable) es de escritura; `driver_detail` expone `license_number`, `phone`, `is_available` del conductor asignado (o `null` si no hay conductor).

---

### TASK-04 — Crear ViewSet `TransportViewSet`

En `apps/transports/views.py`, definir un `ModelViewSet`:

- `queryset`: todos los objetos `Transport` con `select_related('driver')` para evitar N+1 al serializar `driver_detail`.
- `serializer_class`: `TransportSerializer`
- `filterset_fields`: `['transport_type', 'is_active', 'driver']`
- `search_fields`: `['name', 'plate_number']`
- `ordering_fields`: `['name', 'capacity_kg', 'created_at']`

```python
from rest_framework import viewsets
from .models import Transport
from .serializers import TransportSerializer


class TransportViewSet(viewsets.ModelViewSet):
    queryset = Transport.objects.select_related('driver').all()
    serializer_class = TransportSerializer
    filterset_fields = ['transport_type', 'is_active', 'driver']
    search_fields = ['name', 'plate_number']
    ordering_fields = ['name', 'capacity_kg', 'created_at']
```

No se definen acciones personalizadas (`@action`) en esta app.

---

### TASK-05 — Crear `apps/transports/urls.py` con `DefaultRouter`

```python
from rest_framework.routers import DefaultRouter
from .views import TransportViewSet

router = DefaultRouter()
router.register(r'transports', TransportViewSet)

urlpatterns = router.urls
```

Endpoints generados:
- `GET /api/v1/transports/` — listar
- `POST /api/v1/transports/` — crear
- `GET /api/v1/transports/{id}/` — detalle
- `PUT /api/v1/transports/{id}/` — actualización completa
- `PATCH /api/v1/transports/{id}/` — actualización parcial
- `DELETE /api/v1/transports/{id}/` — eliminar

---

### TASK-06 — Registrar en `INSTALLED_APPS`

En `config/settings.py`, agregar `'apps.transports'` a la lista `INSTALLED_APPS` después de `'apps.drivers'`.

---

### TASK-07 — Incluir URLs en `config/urls.py`

En `config/urls.py`, dentro del bloque `api/v1/`, agregar:

```python
path('', include('apps.transports.urls')),
```

---

### TASK-08 — Crear migración y aplicarla

Ejecutar:

```
python manage.py makemigrations transports
python manage.py migrate
```

Verificar que la tabla `transports` se crea con columna `driver_id` nullable como FK a `drivers`.

---

### TASK-09 — Escribir tests

En `apps/transports/tests.py`:

- `TransportModelTest`:
  - Un `Transport` se crea con los campos requeridos.
  - `is_active` es `True` por defecto.
  - `plate_number` es único (dos transportes con la misma placa → `IntegrityError`).
  - `driver` admite `null` — transporte sin conductor es válido.
  - Al eliminar el `Driver` asignado, `transport.driver` queda en `null` (SET_NULL).
  - `transport_type` acepta solo los valores del enum.

- `TransportViewSetTest`:
  - `POST /api/v1/transports/` — creación exitosa sin conductor (201).
  - `POST /api/v1/transports/` — creación exitosa con conductor asignado (201, incluye `driver_detail`).
  - `POST /api/v1/transports/` — `plate_number` duplicado retorna 400.
  - `POST /api/v1/transports/` — `transport_type` inválido retorna 400.
  - `POST /api/v1/transports/` — campos requeridos ausentes retorna 400.
  - `GET /api/v1/transports/` — listado (200).
  - `GET /api/v1/transports/?transport_type=truck` — filtrado por tipo (200).
  - `GET /api/v1/transports/?is_active=true` — filtrado por estado (200).
  - `GET /api/v1/transports/?search=ABC` — búsqueda por `name` o `plate_number` (200).
  - `GET /api/v1/transports/{id}/` — detalle (200).
  - `GET /api/v1/transports/{id}/` — no encontrado (404).
  - `PATCH /api/v1/transports/{id}/` — actualización parcial (200).
  - `DELETE /api/v1/transports/{id}/` — eliminación (204).
  - Request sin autenticación retorna 401.

---

## Decisiones de diseño

### on_delete: SET_NULL en FK a Driver

**Decisión**: `on_delete=models.SET_NULL` con `null=True`.

**Razón**: Un vehículo existe independientemente de si tiene conductor. Si el conductor es eliminado del sistema (baja, reasignación), el transporte debe quedar disponible para asignar otro conductor, no eliminarse. `PROTECT` obligaría a desasignar antes de eliminar el conductor, añadiendo fricción operativa innecesaria para el MVP.

### driver_detail como serializer anidado simple

**Decisión**: `DriverReadSerializer` es un `Serializer` plain (no `ModelSerializer`) con campos explícitos.

**Razón**: Solo se necesitan 4 campos del Driver en la respuesta de Transport. Usar `ModelSerializer` importaría el modelo `Driver` en el módulo de serializers de `transports`, creando un acoplamiento más fuerte. El serializer plain es suficiente y evita importar desde `apps.drivers`.

---

## Criterios de aceptación

1. `python manage.py makemigrations transports` genera una migración sin errores.
2. `python manage.py migrate` crea la tabla `transports` con `driver_id` nullable FK a `drivers`.
3. `GET /api/v1/transports/` retorna 200 con lista paginada autenticado.
4. `GET /api/v1/transports/` retorna 401 sin token JWT.
5. `POST /api/v1/transports/` con `name`, `plate_number`, `transport_type`, `capacity_kg` retorna 201.
6. `POST /api/v1/transports/` con `transport_type='helicopter'` retorna 400.
7. Dos transportes con el mismo `plate_number` → 400.
8. `POST` con `driver` asignado retorna 201 con `driver_detail` no nulo.
9. `?transport_type=truck` filtra por tipo exacto.
10. `?search=ABC` filtra por `name` o `plate_number`.
11. Eliminar el `Driver` asignado → `transport.driver` queda `null`, el transporte no se elimina.
12. `python manage.py test` ejecuta todos los tests sin fallos.
13. `GET /api/docs/` refleja los endpoints de `transports` con los valores del enum `transport_type`.
