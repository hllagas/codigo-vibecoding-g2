# Spec: Fase 8 — `routes`

## Contexto

App Django que gestiona rutas de entrega — secuencias de paradas que conectan un almacen de origen con multiples destinos. Es la primera fase del proyecto que introduce dos modelos dentro de una misma app: `Route` y `RouteStop`. `RouteStop` pertenece completamente a `routes` (FK interna) y no tiene existencia independiente fuera de su ruta padre.

La app `routes` **no existe todavia** en el proyecto — no hay scaffold previo bajo `apps/routes/`. El trabajo de esta fase comienza con `startapp` y procede a implementar todos los archivos.

La tabla `routes_route` referencia `warehouses_warehouse` mediante FK, por lo que la Fase 2 debe estar completamente migrada antes de iniciar esta fase. La tabla `routes_route` sera referenciada a su vez por `shipments_shipment` en la Fase 9 — no renombrar ni mover el modelo `Route` despues de crear la primera migracion.

**Nota de arquitectura**: la app vivira bajo `apps/routes/`, al igual que el resto de apps del proyecto. Su `name` en `apps.py` debe ser `'apps.routes'` y registrarse asi en `INSTALLED_APPS`.

## Dependencias

- **Fase 1** completada: `config/settings.py` con `REST_FRAMEWORK`, JWT y migraciones iniciales aplicadas.
- **Fase 2** (`warehouses`) completada: tabla `warehouses_warehouse` migrada — `Route` tiene FK hacia ella.

---

## Decision de arquitectura: como exponer RouteStop

**Problema**: `RouteStop` pertenece a `Route` (FK con CASCADE). El MVP necesita que las paradas sean visibles al consultar una ruta y que puedan crearse, editarse y eliminarse por separado.

**Opciones evaluadas**:

| Opcion | Descripcion | Veredicto |
|---|---|---|
| A — ViewSet separado con filtro | `RouteStopViewSet` independiente con `?route=<id>` para filtrar | Elegida para el MVP |
| B — Accion anidada en RouteViewSet | `@action(detail=True)` en `RouteViewSet` para gestionar stops | Mas acoplado, complica el router |
| C — Router anidado (drf-nested-routers) | `/routes/{id}/stops/` como URL real anidada | Requiere dependencia externa no instalada |

**Decision**: Opcion A. `RouteStopViewSet` es un `ModelViewSet` independiente registrado en el mismo `urls.py` de la app, con `queryset` filtrado por `route_id` via query param. `RouteSerializer` incluye los stops anidados de solo lectura en las respuestas GET usando `RouteStopSerializer`. Para escritura (POST/PUT/PATCH de rutas), los stops se gestionan via su propio endpoint `/api/v1/route-stops/`.

**Razon**: mantiene la simplicidad del `DefaultRouter` sin dependencias externas, separa claramente las responsabilidades de cada ViewSet y es coherente con el patron usado en las apps anteriores del proyecto.

---

## Estado actual del scaffold

La app `routes` **no existe**. No hay directorio `apps/routes/` en el proyecto.

| Archivo | Estado | Accion en esta fase |
|---|---|---|
| `apps/routes/` | No existe | Crear con `startapp` en T01 |
| `apps/routes/apps.py` | No existe | Ajustar `name` tras `startapp` en T01 |
| `apps/routes/models.py` | No existe | Implementar `Route` y `RouteStop` en T02 |
| `apps/routes/serializers.py` | No existe | Crear en T03 |
| `apps/routes/services.py` | No existe | Crear (vacio para MVP) en T04 |
| `apps/routes/views.py` | No existe | Crear con dos ViewSets en T05 |
| `apps/routes/urls.py` | No existe | Crear en T06 |
| `apps/routes/tests.py` | No existe | Implementar en T08 |
| `apps/routes/migrations/` | No existe | Generar y aplicar en T09 |

---

## Tareas

### T01 — Crear la app y registrarla

- [ ] Desde el directorio raiz del proyecto (`logistics-api/`), ejecutar con el entorno virtual activo:
  ```
  python manage.py startapp routes apps/routes
  ```
  Esto crea `apps/routes/` con el scaffold estandar de Django.

- [ ] Abrir `apps/routes/apps.py` y modificar el campo `name`:
  - Cambiar el valor generado automaticamente (probablemente `'routes'`) a `'apps.routes'`
  - Verificar que `default_auto_field = 'django.db.models.BigAutoField'` esta presente

  El archivo debe quedar asi:
  ```python
  from django.apps import AppConfig


  class RoutesConfig(AppConfig):
      default_auto_field = 'django.db.models.BigAutoField'
      name = 'apps.routes'
  ```

- [ ] Abrir `config/settings.py` y agregar `'apps.routes'` a `INSTALLED_APPS`, a continuacion de `'apps.products'` y antes de cualquier app futura:
  ```python
  'apps.products',
  'apps.routes',   # <- agregar aqui
  ```

**Verificacion**: `python manage.py check` no reporta errores relacionados con `apps.routes` no registrada.

---

### T02 — `apps/routes/models.py`

Esta tarea define los dos modelos de la app. `RouteStop` se define en el mismo archivo que `Route` porque pertenece a la misma app y no tiene sentido sin una ruta padre.

#### Modelo `Route`

- [ ] Importar los modelos y validadores necesarios al inicio del archivo
- [ ] Crear el modelo `Route` con todos los campos de la tabla `routes_route`:

| Campo | Tipo Django | Restricciones |
|---|---|---|
| `name` | `CharField(max_length=200)` | requerido |
| `origin_warehouse` | `ForeignKey('apps.warehouses.Warehouse', on_delete=models.PROTECT)` | requerido, `related_name='routes'` |
| `estimated_duration_hours` | `DecimalField(max_digits=5, decimal_places=2)` | requerido |
| `is_active` | `BooleanField(default=True)` | — |
| `created_at` | `DateTimeField(auto_now_add=True)` | automatico |
| `updated_at` | `DateTimeField(auto_now=True)` | automatico |

- [ ] Agregar clase `Meta` con:
  - `ordering = ['name']`
  - `verbose_name = 'route'`
  - `verbose_name_plural = 'routes'`
- [ ] Agregar metodo `__str__` que retorne `self.name`

#### Modelo `RouteStop`

- [ ] Crear el modelo `RouteStop` en el mismo archivo, despues de `Route`, con todos los campos de la tabla `routes_routestop`:

| Campo | Tipo Django | Restricciones |
|---|---|---|
| `route` | `ForeignKey('Route', on_delete=models.CASCADE)` | requerido, `related_name='stops'` |
| `order` | `SmallIntegerField()` | requerido |
| `address` | `TextField()` | requerido |
| `city` | `CharField(max_length=100)` | requerido |
| `latitude` | `DecimalField(max_digits=9, decimal_places=6)` | `null=True, blank=True` |
| `longitude` | `DecimalField(max_digits=9, decimal_places=6)` | `null=True, blank=True` |

**Nota critica**: `RouteStop` no tiene campos `created_at` ni `updated_at` — el schema no los incluye. No agregarlos.

- [ ] Agregar clase `Meta` con:
  - `ordering = ['route', 'order']`
  - `verbose_name = 'route stop'`
  - `verbose_name_plural = 'route stops'`
  - `unique_together = [['route', 'order']]` — no puede haber dos paradas con el mismo numero de orden dentro de la misma ruta
- [ ] Agregar metodo `__str__` que retorne `f"Stop {self.order} — {self.city} ({self.route.name})"`

**Verificacion**: `python manage.py check` no reporta errores de modelos. `python manage.py makemigrations --check apps.routes` detecta cambios pendientes (indica que los modelos estan definidos correctamente).

---

### T03 — `apps/routes/serializers.py`

- [ ] Crear el archivo `apps/routes/serializers.py` (no existe — `startapp` no lo genera)
- [ ] El archivo debe contener tres serializers: `WarehouseSummarySerializer`, `RouteStopSerializer` y `RouteSerializer`

#### `WarehouseSummarySerializer`

Serializer auxiliar de solo lectura para representar el almacen origen de forma resumida en las respuestas GET de rutas. Expone unicamente `id` y `name` del warehouse.

- Solo se usa para lectura — no se usa en operaciones de escritura

#### `RouteStopSerializer`

Serializer completo para el modelo `RouteStop`. Usado tanto para lectura (anidado dentro de `RouteSerializer`) como para escritura (en su propio ViewSet).

- `Meta.model = RouteStop`
- `Meta.fields = '__all__'`
- `Meta.read_only_fields = ['id']`
- El campo `route` es un `PrimaryKeyRelatedField` en escritura (ID entero) — comportamiento por defecto de DRF con FK
- En lectura anidada dentro de `RouteSerializer`, el campo `route` quedara implicitamente provisto por el contexto — no requiere tratamiento especial

#### `RouteSerializer`

Serializer principal para el modelo `Route`. Maneja la dualidad lectura/escritura:

- **Escritura (POST/PUT/PATCH)**: el campo `origin_warehouse` se recibe como entero (ID de FK)
- **Lectura (GET)**: el campo `origin_warehouse` devuelve un objeto `{id, name}` via `to_representation`; ademas, el campo `stops` devuelve la lista de paradas anidadas ordenadas por `order`

Configuracion:

- `Meta.model = Route`
- `Meta.fields = '__all__'`
- `Meta.read_only_fields = ['id', 'created_at', 'updated_at']`

Logica de `to_representation`:

- Reemplazar el campo `origin_warehouse` con `WarehouseSummarySerializer(instance.origin_warehouse).data`
- Agregar el campo `stops` usando `RouteStopSerializer(instance.stops.all(), many=True).data`
- El campo `stops` es de solo lectura en este serializer — para crear o modificar paradas se usa el endpoint `/api/v1/route-stops/`

Comportamiento esperado en escritura (body de POST para crear ruta):
```json
{
  "name": "Ruta Lima Norte",
  "origin_warehouse": 1,
  "estimated_duration_hours": "3.50",
  "is_active": true
}
```

Comportamiento esperado en lectura (respuesta GET de una ruta):
```json
{
  "id": 1,
  "name": "Ruta Lima Norte",
  "origin_warehouse": { "id": 1, "name": "Almacen Central Lima" },
  "estimated_duration_hours": "3.50",
  "is_active": true,
  "stops": [
    {
      "id": 1,
      "route": 1,
      "order": 1,
      "address": "Av. Universitaria 1234",
      "city": "Lima",
      "latitude": "-12.046374",
      "longitude": "-77.042793"
    },
    {
      "id": 2,
      "route": 1,
      "order": 2,
      "address": "Jr. Los Olivos 567",
      "city": "Los Olivos",
      "latitude": null,
      "longitude": null
    }
  ],
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T10:00:00Z"
}
```

Comportamiento esperado en escritura de una parada (body de POST a `/api/v1/route-stops/`):
```json
{
  "route": 1,
  "order": 3,
  "address": "Av. Tupac Amaru 890",
  "city": "Independencia",
  "latitude": null,
  "longitude": null
}
```

**Verificacion**: desde Django shell, importar `RouteSerializer` y `RouteStopSerializer` sin errores.

---

### T04 — `apps/routes/services.py`

- [ ] Crear el archivo `apps/routes/services.py` (no existe — `startapp` no lo genera)
- [ ] La app `routes` no tiene logica de negocio en el MVP. El archivo debe existir por coherencia arquitectonica con el resto de apps del proyecto pero puede estar vacio salvo por un comentario que documente esta decision:

```python
# services.py — routes
# No hay logica de negocio en el MVP para esta app.
# La gestion de rutas y paradas es CRUD puro delegado al ORM via los ViewSets.
```

**Verificacion**: el archivo existe y se puede importar sin errores.

---

### T05 — `apps/routes/views.py`

- [ ] Reemplazar el contenido del scaffold vacio en `apps/routes/views.py`
- [ ] Crear dos ViewSets: `RouteViewSet` y `RouteStopViewSet`

#### `RouteViewSet`

- Extiende `ModelViewSet`
- `queryset`: usar `select_related('origin_warehouse')` para evitar N+1 al serializar `origin_warehouse` en cada ruta. El prefetch de stops se maneja con `prefetch_related('stops')` — necesario porque es una relacion inversa (1:N), no una FK directa
- `serializer_class = RouteSerializer`
- Sin permisos custom en MVP — hereda `DEFAULT_PERMISSION_CLASSES` de `REST_FRAMEWORK` (JWT requerido)
- Sin acciones custom (`@action`)

El queryset completo debe ser:
```
Route.objects.select_related('origin_warehouse').prefetch_related('stops').all()
```

#### `RouteStopViewSet`

- Extiende `ModelViewSet`
- `queryset = RouteStop.objects.select_related('route').all()`
- `serializer_class = RouteStopSerializer`
- Sin permisos custom en MVP
- Sin acciones custom

**Nota**: no agregar filtrado automatico por `route_id` en el ViewSet. El queryset devuelve todos los stops y el cliente puede filtrar usando `?route=<id>` si el proyecto agrega `django-filter` en el futuro. Para el MVP, el listado completo de stops es aceptable.

**Verificacion**: desde Django shell, importar `RouteViewSet` y `RouteStopViewSet` sin errores.

---

### T06 — `apps/routes/urls.py`

- [ ] Crear el archivo `apps/routes/urls.py` (no existe — `startapp` no lo genera)
- [ ] Registrar ambos ViewSets usando `DefaultRouter` de DRF:
  - `RouteViewSet` con prefix `routes`
  - `RouteStopViewSet` con prefix `route-stops`

Resultado esperado en `urlpatterns`:

| URL generada | Metodos | Descripcion |
|---|---|---|
| `/api/v1/routes/` | GET, POST | Listar y crear rutas |
| `/api/v1/routes/{id}/` | GET, PUT, PATCH, DELETE | Detalle, edicion y borrado de una ruta |
| `/api/v1/route-stops/` | GET, POST | Listar y crear paradas |
| `/api/v1/route-stops/{id}/` | GET, PUT, PATCH, DELETE | Detalle, edicion y borrado de una parada |

**Verificacion**: el archivo existe y se puede importar sin errores.

---

### T07 — Incluir en `config/urls.py`

- [ ] Abrir `config/urls.py`
- [ ] Agregar el `include` de `apps.routes.urls` bajo el prefijo `/api/v1/`, a continuacion de la linea de `apps.products.urls`:

```python
path('api/v1/', include('apps.products.urls')),
path('api/v1/', include('apps.routes.urls')),   # <- agregar aqui
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
]
```

**Verificacion**: `python manage.py check` no reporta errores de URL.

---

### T08 — `apps/routes/tests.py`

- [ ] Reemplazar el contenido del scaffold vacio en `apps/routes/tests.py`
- [ ] Crear dos clases de test: `TestRouteModel` y `TestRouteStopModel`

#### Clase `TestRouteModel`

Prueba el modelo `Route` y la integridad de sus datos.

**Setup**:
- Crear una instancia de `Warehouse` en `setUp` — es FK requerida para `Route`

**Casos de prueba requeridos**:

| Nombre del test | Descripcion |
|---|---|
| `test_create_route` | Crear una `Route` con todos los campos requeridos y verificar que se persiste con los valores correctos, incluyendo `is_active=True` por defecto |
| `test_str_retorna_name` | `str(route)` retorna el campo `name` |
| `test_is_active_default_true` | Al crear una ruta sin especificar `is_active`, el valor por defecto es `True` |
| `test_origin_warehouse_protect` | Intentar eliminar un `Warehouse` que tiene rutas asociadas lanza `ProtectedError` |

#### Clase `TestRouteStopModel`

Prueba el modelo `RouteStop` y su relacion con `Route`.

**Setup**:
- Crear instancias de `Warehouse` y `Route` en `setUp`

**Casos de prueba requeridos**:

| Nombre del test | Descripcion |
|---|---|
| `test_create_routestop` | Crear un `RouteStop` con todos los campos requeridos y verificar que se persiste correctamente |
| `test_str_incluye_order_city_route` | `str(stop)` contiene el numero de orden, la ciudad y el nombre de la ruta |
| `test_cascade_delete_on_route_delete` | Al eliminar una `Route`, todos sus `RouteStop` asociados se eliminan automaticamente (CASCADE) |
| `test_unique_together_order_route` | Crear dos `RouteStop` con el mismo `route` y el mismo `order` lanza `IntegrityError` |
| `test_latitude_longitude_nullable` | Crear un `RouteStop` sin `latitude` ni `longitude` no lanza error |

- [ ] Usar `TestCase` de Django para tener acceso a la base de datos de prueba
- [ ] No hacer tests de endpoints HTTP en esta fase — los tests de views se agregan en una fase de QA posterior

**Verificacion**: `python manage.py test apps.routes` ejecuta los tests sin errores de importacion ni de configuracion.

---

### T09 — Crear y aplicar migraciones

- [ ] Ejecutar `python manage.py makemigrations apps.routes`
  - Debe generar `apps/routes/migrations/0001_initial.py`
  - Verificar que el archivo generado incluye:
    - Modelo `Route` con FK hacia `apps.warehouses.Warehouse` con `on_delete=PROTECT`
    - Modelo `RouteStop` con FK hacia `routes.Route` con `on_delete=CASCADE`
    - Todos los campos de `Route`: `name`, `origin_warehouse`, `estimated_duration_hours`, `is_active`, `created_at`, `updated_at`
    - Todos los campos de `RouteStop`: `route`, `order`, `address`, `city`, `latitude`, `longitude` — **sin** `created_at` ni `updated_at`
    - La restriccion `unique_together` en `RouteStop` para `(route, order)`

- [ ] Ejecutar `python manage.py migrate`
  - Debe aplicar `apps.routes.0001_initial` sin errores
  - La tabla `warehouses_warehouse` debe existir previamente — si la migracion falla por FK faltante, verificar que la Fase 2 este migrada

**Verificacion**: `python manage.py migrate --check` retorna sin pendientes. Las tablas `routes_route` y `routes_routestop` existen en `db.sqlite3`.

---

### T10 — Verificacion integral de la Fase 8

- [ ] `python manage.py check` retorna "System check identified no issues"
- [ ] `python manage.py migrate --check` retorna sin pendientes
- [ ] Desde Django shell:
  - `from apps.routes.models import Route, RouteStop; print(Route._meta.fields)` muestra todos los campos de Route incluyendo `origin_warehouse_id`
  - `from apps.routes.models import RouteStop; print(RouteStop._meta.fields)` muestra todos los campos de RouteStop sin `created_at` ni `updated_at`
  - `from apps.routes.serializers import RouteSerializer, RouteStopSerializer; print(RouteSerializer().fields.keys())` muestra los campos incluyendo `stops`
- [ ] `python manage.py test apps.routes` — todos los tests de `TestRouteModel` y `TestRouteStopModel` pasan
- [ ] Con el servidor activo (iniciado manualmente por el usuario):
  - `GET /api/v1/routes/` retorna `401` sin token JWT y `200` con token valido
  - `GET /api/v1/route-stops/` retorna `401` sin token y `200` con token valido
  - `POST /api/v1/routes/` con body valido crea la ruta y la respuesta incluye el campo `stops` como lista vacia `[]`
  - `POST /api/v1/route-stops/` con `route` valido crea la parada y aparece en `GET /api/v1/routes/{id}/` dentro del campo `stops`

---

## Endpoints resultantes

### Rutas (`Route`)

| Metodo | URL | Descripcion | Body requerido |
|---|---|---|---|
| GET | `/api/v1/routes/` | Listar todas las rutas (paginado, con stops anidados) | — |
| POST | `/api/v1/routes/` | Crear una ruta nueva | Ver campos requeridos |
| GET | `/api/v1/routes/{id}/` | Obtener una ruta por ID (con stops anidados) | — |
| PUT | `/api/v1/routes/{id}/` | Actualizar todos los campos de la ruta | Ver campos requeridos |
| PATCH | `/api/v1/routes/{id}/` | Actualizar campos parcialmente | Campos a modificar |
| DELETE | `/api/v1/routes/{id}/` | Eliminar una ruta (y sus stops por CASCADE) | — |

### Paradas (`RouteStop`)

| Metodo | URL | Descripcion | Body requerido |
|---|---|---|---|
| GET | `/api/v1/route-stops/` | Listar todas las paradas (paginado) | — |
| POST | `/api/v1/route-stops/` | Crear una parada nueva | Ver campos requeridos |
| GET | `/api/v1/route-stops/{id}/` | Obtener una parada por ID | — |
| PUT | `/api/v1/route-stops/{id}/` | Actualizar todos los campos de la parada | Ver campos requeridos |
| PATCH | `/api/v1/route-stops/{id}/` | Actualizar campos parcialmente | Campos a modificar |
| DELETE | `/api/v1/route-stops/{id}/` | Eliminar una parada | — |

Todos los endpoints requieren header:
```
Authorization: Bearer <access_token>
```

---

## Validaciones implicitas de modelo y DRF

- `origin_warehouse` debe referenciar un ID existente en `warehouses_warehouse` — DRF retorna `400` si el ID no existe
- `route` en `RouteStop` debe referenciar un ID existente en `routes_route` — DRF retorna `400` si el ID no existe
- `name` y `estimated_duration_hours` son requeridos en `Route` — DRF retorna `400` por campo si se omiten
- `order`, `address`, `city` y `route` son requeridos en `RouteStop` — DRF retorna `400` por campo si se omiten
- `latitude` y `longitude` son opcionales — se pueden omitir o enviar `null`
- La restriccion `unique_together(route, order)` produce un error `400` con el mensaje de DRF si se intenta duplicar el par

---

## Notas al Implement Agent

1. **Ejecutar `startapp` antes de cualquier otra tarea**: a diferencia de `products`, no existe ningun scaffold previo. El directorio `apps/routes/` no existe — `startapp` lo crea completo.

2. **`name = 'apps.routes'` en `apps.py` es obligatorio**: Django usa este valor para construir el label de la app (`apps.routes`) que aparece en las FK de migraciones. Si se deja como `'routes'`, las migraciones generaran FK incorrectas que apuntaran a `routes.Route` en lugar de `apps.routes.Route`, causando conflictos en la Fase 9.

3. **`on_delete=PROTECT` en `Route.origin_warehouse`**: no se puede eliminar un `Warehouse` que tenga rutas asociadas. Django lanzara `ProtectedError` (que DRF convierte en HTTP 409 o 500 dependiendo de la configuracion del handler de errores). Es el comportamiento correcto para el MVP.

4. **`on_delete=CASCADE` en `RouteStop.route`**: al eliminar una `Route`, todos sus `RouteStop` se eliminan automaticamente. Este es el comportamiento semantico correcto — las paradas no tienen sentido sin su ruta padre.

5. **`RouteStop` no tiene `created_at` ni `updated_at`**: el schema los excluye explicitamente. No agregarlos aunque sea la convencion de otras apps del proyecto.

6. **`select_related` + `prefetch_related` en `RouteViewSet`**: `select_related('origin_warehouse')` evita N+1 al acceder a `route.origin_warehouse.name`. `prefetch_related('stops')` evita N+1 al iterar `instance.stops.all()` dentro de `to_representation` del `RouteSerializer`. Sin ambos, un listado de 20 rutas con 5 paradas cada una generaria 1 + 20 + 100 queries.

7. **`stops` es de solo lectura en `RouteSerializer`**: los stops se crean y modifican via el endpoint `/api/v1/route-stops/`. El `RouteSerializer` solo los muestra en la respuesta GET. No implementar escritura anidada de stops en el `RouteSerializer` — añade complejidad innecesaria al MVP.

8. **`unique_together = [['route', 'order']]` en `RouteStop.Meta`**: garantiza que no haya dos paradas con el mismo numero de orden dentro de la misma ruta. DRF valida esta restriccion automaticamente en el serializer antes de intentar el INSERT.

9. **El test `test_cascade_delete_on_route_delete`**: para verificar el CASCADE, crear una ruta con al menos un stop, eliminar la ruta con `route.delete()`, y luego verificar que `RouteStop.objects.filter(route=route).count()` es 0. Django puede lanzar advertencia de referencia a objeto eliminado al acceder al campo `route` del stop despues de la eliminacion — usar el filtro por ID directamente.

10. **`config/urls.py` ya tiene seis lineas de `include`**: agregar la linea de `apps.routes.urls` a continuacion de `apps.products.urls`. No reemplazar ninguna linea existente.

11. **La tabla `routes_route` sera referenciada como FK en la Fase 9 (`shipments`)**: `shipments_shipment` tiene `FK → routes_route` (nullable). No renombrar ni mover el modelo `Route` despues de crear la primera migracion.
