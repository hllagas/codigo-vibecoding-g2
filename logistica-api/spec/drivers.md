# Spec: drivers — Phase 4

## Contexto

La app `drivers` extiende `auth_user` con datos específicos del conductor mediante una relación OneToOne. Cada conductor es un usuario del sistema con credenciales de acceso, enriquecido con datos operativos: número de licencia, vencimiento, teléfono y disponibilidad. Esta app es prerequisito de `transports` (Phase 6), que referencia `Driver` mediante FK.

---

## Dependencias

- **`auth_user`**: Django gestiona este modelo internamente. La FK se referencia mediante `settings.AUTH_USER_MODEL` (equivalente a `'auth.User'`). Requiere que exista un `User` antes de crear un `Driver`.
- No depende de ninguna app custom del proyecto. Solo requiere el setup base de Phase 1: Django, DRF, `django-filter`, `drf-spectacular`, configuración JWT en `settings.py`.

---

## Tareas

### TASK-01 — Crear app Django `drivers` dentro de `apps/`

Ejecutar desde la raíz del proyecto:

```
python manage.py startapp drivers apps/drivers
```

Luego actualizar `apps/drivers/apps.py` y cambiar el campo `name` a:

```
name = 'apps.drivers'
```

Verificar que se cree la carpeta `apps/drivers/` con `models.py`, `views.py`, `apps.py`, etc.

---

### TASK-02 — Crear modelo `Driver`

En `apps/drivers/models.py`, definir el modelo con exactamente los siguientes campos según `database-schema.md`:

| Campo | Tipo Django | Detalles |
|---|---|---|
| `user` | `OneToOneField` | `settings.AUTH_USER_MODEL`, `on_delete=models.CASCADE`, `related_name='driver_profile'` |
| `license_number` | `CharField` | `max_length=50`, `unique=True`, `null=False` |
| `license_expiry` | `DateField` | `null=False` |
| `phone` | `CharField` | `max_length=20`, `null=False` |
| `is_available` | `BooleanField` | `default=True` |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

La clase `Meta` debe definir:
- `db_table = 'drivers'`
- `ordering = ['user__username']`

Importar `settings` desde `django.conf`:

```python
from django.conf import settings
from django.db import models

class Driver(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driver_profile',
    )
    license_number = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField()
    phone = models.CharField(max_length=20)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'drivers'
        ordering = ['user__username']

    def __str__(self):
        return f"{self.user.username} — {self.license_number}"
```

---

### TASK-03 — Crear serializer `DriverSerializer`

En `apps/drivers/serializers.py`, definir un `ModelSerializer` para el modelo `Driver`.

Para el MVP, incluir campos de `auth_user` como read-only usando un serializer anidado de solo lectura. Esto facilita la lectura sin complicar la escritura: al crear o actualizar un Driver, se envía `user` como ID entero; en la respuesta, `user_detail` expone los datos del usuario.

```python
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Driver

User = get_user_model()


class UserReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username', 'email', 'first_name', 'last_name']


class DriverSerializer(serializers.ModelSerializer):
    user_detail = UserReadSerializer(source='user', read_only=True)

    class Meta:
        model = Driver
        fields = [
            'id',
            'user',
            'user_detail',
            'license_number',
            'license_expiry',
            'phone',
            'is_available',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user_detail', 'created_at', 'updated_at']
```

El campo `user` (FK entero) es de escritura; `user_detail` es de solo lectura y se incluye en todas las respuestas para evitar que el cliente tenga que hacer una segunda request para obtener el nombre del conductor.

---

### TASK-04 — Crear ViewSet `DriverViewSet`

En `apps/drivers/views.py`, definir un `ModelViewSet`:

- `queryset`: todos los objetos `Driver` con `select_related('user')` para evitar N+1 al serializar `user_detail`.
- `serializer_class`: `DriverSerializer`
- `filterset_fields`: `['is_available']`
- `search_fields`: `['license_number', 'phone']`
- `ordering_fields`: `['license_expiry', 'created_at']`

```python
from rest_framework import viewsets
from .models import Driver
from .serializers import DriverSerializer


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.select_related('user').all()
    serializer_class = DriverSerializer
    filterset_fields = ['is_available']
    search_fields = ['license_number', 'phone']
    ordering_fields = ['license_expiry', 'created_at']
```

No se definen acciones personalizadas (`@action`) en esta app.

---

### TASK-05 — Crear `apps/drivers/urls.py` con `DefaultRouter`

En `apps/drivers/urls.py`:

- Instanciar `DefaultRouter`
- Registrar `DriverViewSet` bajo el prefijo `'drivers'`
- Exponer `urlpatterns = router.urls`

```python
from rest_framework.routers import DefaultRouter
from .views import DriverViewSet

router = DefaultRouter()
router.register(r'drivers', DriverViewSet)

urlpatterns = router.urls
```

Los endpoints generados automáticamente serán:
- `GET /api/v1/drivers/` — listar conductores
- `POST /api/v1/drivers/` — crear conductor
- `GET /api/v1/drivers/{id}/` — detalle de conductor
- `PUT /api/v1/drivers/{id}/` — actualización completa
- `PATCH /api/v1/drivers/{id}/` — actualización parcial
- `DELETE /api/v1/drivers/{id}/` — eliminar conductor

---

### TASK-06 — Registrar en `INSTALLED_APPS`

En `config/settings.py`, agregar `'apps.drivers'` a la lista `INSTALLED_APPS`.

---

### TASK-07 — Incluir URLs en `config/urls.py`

En `config/urls.py`, dentro del bloque `api/v1/`, agregar:

```python
path('', include('apps.drivers.urls')),
```

La ruta final de los endpoints será `http://localhost:8000/api/v1/drivers/`.

---

### TASK-08 — Crear migración y aplicarla

Ejecutar:

```
python manage.py makemigrations drivers
python manage.py migrate
```

Verificar que la tabla `drivers` se crea correctamente con la columna `user_id` como FK única a `auth_user`.

---

### TASK-09 — Escribir tests

En `apps/drivers/tests/`:

- Crear `__init__.py` vacío
- `test_models.py`: verificar que un `Driver` se crea con los campos requeridos, que `is_available` es `True` por defecto, que `license_number` es único, y que al eliminar el `User` asociado el `Driver` también se elimina (CASCADE).
- `test_views.py`: usar `APITestCase`. Cubrir:
  - `POST /api/v1/drivers/` — creación exitosa (201)
  - `POST /api/v1/drivers/` — datos inválidos (400, ej: `license_number` duplicado)
  - `POST /api/v1/drivers/` — `user` ya tiene perfil de conductor (400, unique constraint OneToOne)
  - `GET /api/v1/drivers/` — listado (200)
  - `GET /api/v1/drivers/?is_available=true` — filtro por disponibilidad (200)
  - `GET /api/v1/drivers/?search=ABC123` — búsqueda por `license_number` (200)
  - `GET /api/v1/drivers/{id}/` — detalle con `user_detail` anidado (200)
  - `GET /api/v1/drivers/{id}/` — no encontrado (404)
  - `PATCH /api/v1/drivers/{id}/` — cambiar `is_available` a `false` (200)
  - `DELETE /api/v1/drivers/{id}/` — eliminación (204)
  - Request sin autenticación (401)

Patrón base del setUp:

```python
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from apps.drivers.models import Driver
import datetime

class DriverViewSetTest(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='admin', password='pass')
        self.client.force_authenticate(user=self.auth_user)
        self.driver_user = User.objects.create_user(
            username='driver01', password='pass',
            first_name='Juan', last_name='Pérez'
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='+573001234567',
        )
```

---

## Decisiones de diseño

### OneToOne con auth_user en el serializer

**Decisión**: Usar un serializer anidado de solo lectura (`UserReadSerializer`) expuesto como `user_detail`, manteniendo `user` (FK entero) como campo de escritura.

**Razón**: El MVP debe mostrar datos del conductor de forma completa (nombre, email) sin forzar al cliente a hacer una segunda request a `/api/v1/users/`. Al separar lectura (`user_detail`) de escritura (`user`), el contrato de creación es simple (se envía el ID del User) y la respuesta es rica (incluye username, email, first_name, last_name).

**Alternativa descartada**: `depth = 1` en Meta. Funciona para lectura pero rompe la escritura al intentar enviar un objeto anidado en lugar de un ID.

### on_delete: CASCADE

**Decisión**: `on_delete=models.CASCADE` en el OneToOne hacia `auth_user`.

**Razón**: Un `Driver` sin `User` no tiene sentido operativo. Si se desactiva o elimina la cuenta del usuario, el perfil de conductor debe eliminarse con él. No hay datos históricos directamente en `Driver` que justifiquen preservarlo (el historial de envíos está en `routes`/`transports`).

### Flujo de creación de un Driver

**Decisión**: El `User` debe existir previamente. El endpoint `POST /api/v1/drivers/` recibe `user` como ID entero.

**Razón**: En el MVP, la creación de usuarios se gestiona por separado (vía Django admin o endpoint de auth). Combinar creación de User y Driver en una sola request añadiría lógica transaccional que no corresponde al MVP. El flujo operativo es:
1. El administrador crea el `User` via Django admin o `/api/token/`.
2. El administrador crea el `Driver` enviando el `user` ID junto con los datos de licencia.

Si el `user` enviado ya tiene un perfil de conductor, DRF retorna 400 por la restricción unique del OneToOne.

---

## Criterios de aceptación

1. `python manage.py makemigrations drivers` genera una migración sin errores.
2. `python manage.py migrate` aplica la migración y crea la tabla `drivers` con columna `user_id` como FK única a `auth_user`.
3. `GET /api/v1/drivers/` retorna 200 con lista paginada cuando el usuario está autenticado.
4. `GET /api/v1/drivers/` retorna 401 sin token JWT.
5. `POST /api/v1/drivers/` con `user`, `license_number`, `license_expiry`, `phone` retorna 201 con el objeto creado, incluyendo `user_detail` con username y email.
6. `POST /api/v1/drivers/` con un `user` que ya tiene Driver retorna 400.
7. Dos drivers con el mismo `license_number` generan error 400 (unique constraint).
8. `?is_available=true` filtra conductores disponibles.
9. `?search=LIC` filtra por `license_number` o `phone`.
10. La respuesta de detalle incluye `user_detail` con `username`, `email`, `first_name`, `last_name`.
11. Al eliminar un `User`, su `Driver` asociado se elimina automáticamente (CASCADE).
12. `python manage.py test drivers` ejecuta todos los tests sin fallos.
13. `GET /api/docs/` refleja los endpoints de `drivers` en la documentación OpenAPI.
