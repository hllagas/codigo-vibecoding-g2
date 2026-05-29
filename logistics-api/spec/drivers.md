# Spec: Fase 5 — `drivers`

## Contexto

App Django independiente que gestiona los conductores de la plataforma logística. Un conductor es la persona asignada a un transporte para realizar entregas. Al igual que `customers` (Fase 4), esta app **extiende `auth_user`** mediante `OneToOneField` — el conductor puede autenticarse en el sistema.

La creación de un `Driver` implica crear primero un `auth_user` y luego el perfil extendido, con asignación automática al grupo `driver`. Esta lógica vive exclusivamente en `services.py`.

La tabla resultante (`drivers_driver`) será referenciada como FK en `shipments_shipment` (Fase 9). Esta app debe quedar completamente funcional antes de avanzar a esa fase.

**Nota de arquitectura**: la app vive en la raíz del proyecto (mismo nivel que `customers/`, `warehouses/`, `suppliers/` y `manage.py`), no bajo `apps/`. Se registra como `'drivers'` en `INSTALLED_APPS`, coherente con el patrón de las fases anteriores.

**Endpoint especial**: `POST /api/v1/drivers/register/` es **público** (`AllowAny`) para permitir el autoregistro de conductores. El resto de endpoints del CRUD requieren autenticación JWT.

## Dependencias

- **Fase 1** completada: `config/settings.py` con `REST_FRAMEWORK`, JWT configurado, grupos de permisos creados (`admin`, `operator`, `driver`, `customer`), migraciones iniciales aplicadas.
- **Fase 4** completada: patrón `OneToOneField → auth_user` ya probado en `customers`. Los mismos principios aplican aquí.
- `auth_user` (tabla built-in de Django) debe existir — se garantiza con cualquier migración inicial.
- No depende de `warehouses`, `suppliers`, `products`, `transports`, `routes` ni `shipments`.

---

## Tareas

### T01 — Crear la app `drivers`

- [ ] Ejecutar `python manage.py startapp drivers` en la raíz del proyecto (mismo nivel que `customers/`, `products/`, `warehouses/`, `suppliers/` y `manage.py`)
- [ ] Verificar que se creó el directorio `drivers/` con la estructura estándar de Django: `models.py`, `views.py`, `apps.py`, `tests.py`, `admin.py`, `migrations/`

**Verificación**: el directorio `drivers/` existe en la raíz del proyecto.

---

### T02 — `drivers/apps.py`

- [ ] Abrir `drivers/apps.py` generado por `startapp`
- [ ] Verificar que `name = 'drivers'` (no `'apps.drivers'`, la app vive en la raíz)
- [ ] Verificar que `default_auto_field = 'django.db.models.BigAutoField'`

El archivo debe quedar exactamente así:

```python
from django.apps import AppConfig


class DriversConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'drivers'
```

**Verificación**: `name` es `'drivers'`.

---

### T03 — Registrar en `INSTALLED_APPS`

- [ ] Abrir `config/settings.py`
- [ ] Agregar `'drivers'` a `INSTALLED_APPS`, después de `'customers'` y antes de cualquier app que dependa de ella:

```python
INSTALLED_APPS = [
    # Django built-in
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Terceros
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    # Apps del proyecto
    'products',
    'warehouses',
    'suppliers',
    'customers',
    'drivers',   # ← agregar aquí
]
```

**Verificación**: `python manage.py check` no reporta errores relacionados con apps no registradas.

---

### T04 — `drivers/models.py`

- [ ] Importar `settings` de `django.conf` y `models` de `django.db`
- [ ] Definir la clase interna `LicenseType` como `models.TextChoices` con los valores exactos del schema:

| Valor DB | Label |
|---|---|
| `'A'` | `'A'` |
| `'B'` | `'B'` |
| `'C'` | `'C'` |

- [ ] Definir la clase interna `Status` como `models.TextChoices` con los valores exactos del schema:

| Valor DB | Label |
|---|---|
| `'AVAILABLE'` | `'Available'` |
| `'ON_ROUTE'` | `'On Route'` |
| `'OFF_DUTY'` | `'Off Duty'` |

- [ ] Crear el modelo `Driver` con todos los campos del schema `drivers_driver`:

| Campo | Tipo Django | Restricciones |
|---|---|---|
| `user` | `OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='driver_profile')` | único, requerido |
| `license_number` | `CharField(max_length=50)` | `unique=True` |
| `license_type` | `CharField(max_length=10, choices=LicenseType.choices)` | requerido |
| `phone` | `CharField(max_length=20)` | requerido |
| `status` | `CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)` | requerido, default `AVAILABLE` |
| `created_at` | `DateTimeField(auto_now_add=True)` | automático |
| `updated_at` | `DateTimeField(auto_now=True)` | automático |

- [ ] Agregar clase `Meta` con:
  - `ordering = ['user__last_name', 'user__first_name']`
  - `verbose_name = 'driver'`
  - `verbose_name_plural = 'drivers'`
- [ ] Agregar método `__str__` que retorne `f"{self.user.get_full_name()} — Licencia {self.license_number}"`

**Verificación**: `python manage.py check` no reporta errores de modelos. `python manage.py makemigrations --check drivers` detecta cambios pendientes.

---

### T05 — `drivers/serializers.py` — Serializer de escritura (registro)

- [ ] Crear el archivo `drivers/serializers.py` (no existe aún, `startapp` no lo genera)
- [ ] Crear `DriverRegistrationSerializer` extendiendo `serializers.Serializer` (no `ModelSerializer`, porque combina campos de dos modelos):
  - **Campos del `auth_user`**:
    - `username` — `CharField(max_length=150)`, requerido
    - `email` — `EmailField(max_length=254)`, requerido
    - `password` — `CharField(max_length=128)`, `write_only=True`, requerido — **nunca debe aparecer en la respuesta**
    - `first_name` — `CharField(max_length=150)`, requerido
    - `last_name` — `CharField(max_length=150)`, requerido
  - **Campos del `Driver`**:
    - `license_number` — `CharField(max_length=50)`, requerido
    - `license_type` — `ChoiceField(choices=Driver.LicenseType.choices)`, requerido
    - `phone` — `CharField(max_length=20)`, requerido
    - `status` — `ChoiceField(choices=Driver.Status.choices)`, `required=False` — si no se proporciona, el service usará el default `AVAILABLE`
- [ ] Agregar validación en `validate_username`: verificar que no existe ya un `User` con ese `username`; lanzar `serializers.ValidationError` si está duplicado
- [ ] Agregar validación en `validate_email`: verificar que no existe ya un `User` con ese `email`; lanzar `serializers.ValidationError` si está duplicado
- [ ] Agregar validación en `validate_license_number`: verificar que no existe ya un `Driver` con ese `license_number`; lanzar `serializers.ValidationError` si está duplicado
- [ ] No implementar `create()` en el serializer — la creación la maneja `services.create_driver(data)`

**Verificación**: importar `DriverRegistrationSerializer` desde Django shell sin errores. Instanciar con datos válidos e inválidos y confirmar que `is_valid()` funciona.

---

### T06 — `drivers/serializers.py` — Serializer de lectura

- [ ] En el mismo archivo `drivers/serializers.py`, crear `DriverSerializer` extendiendo `ModelSerializer`:
  - `Meta.model = Driver`
  - `Meta.fields` debe incluir explícitamente:
    - `id` — del modelo `Driver`
    - `username` — campo de solo lectura mapeado desde `user.username`
    - `email` — campo de solo lectura mapeado desde `user.email`
    - `first_name` — campo de solo lectura mapeado desde `user.first_name`
    - `last_name` — campo de solo lectura mapeado desde `user.last_name`
    - `license_number`
    - `license_type`
    - `phone`
    - `status`
    - `created_at`
    - `updated_at`
  - `Meta.read_only_fields = ['id', 'created_at', 'updated_at']`
- [ ] Declarar los campos del `auth_user` con el parámetro `source`:
  - `username = serializers.CharField(source='user.username', read_only=True)`
  - `email = serializers.EmailField(source='user.email', read_only=True)`
  - `first_name = serializers.CharField(source='user.first_name', read_only=True)`
  - `last_name = serializers.CharField(source='user.last_name', read_only=True)`
- [ ] El campo `password` **nunca** debe aparecer en `DriverSerializer` — ni en input ni en output

**Verificación**: instanciar `DriverSerializer` con un `Driver` existente y confirmar que la respuesta incluye `username`, `email`, `first_name`, `last_name`, `license_number`, `license_type`, `phone`, `status` y **no** incluye `password`.

---

### T07 — `drivers/services.py`

- [ ] Crear el archivo `drivers/services.py` (no existe aún)
- [ ] Importar `get_user_model`, `Group` de `django.contrib.auth.models`, `ValidationError` de `django.core.exceptions`, `transaction` de `django.db`, y `Driver` del modelo local
- [ ] Implementar la función `create_driver(data)` con la siguiente lógica exacta, en orden:
  1. Extraer del dict `data` los campos del `auth_user`: `username`, `email`, `password`, `first_name`, `last_name`
  2. Extraer los campos del `Driver`: `license_number`, `license_type`, `phone`; obtener `status` con `data.get('status', Driver.Status.AVAILABLE)` para usar el default si no se proporciona
  3. Crear el `auth_user` usando `User.objects.create_user(username, email, password, first_name=first_name, last_name=last_name)` — usar `create_user` (no `create`) para que el password se hashee correctamente
  4. Recuperar el grupo `driver` usando `Group.objects.get(name='driver')` — si el grupo no existe, capturar `Group.DoesNotExist` y lanzar `ValidationError` con mensaje descriptivo
  5. Asignar el usuario al grupo: `user.groups.add(group)`
  6. Crear el `Driver` con `Driver.objects.create(user=user, license_number=license_number, license_type=license_type, phone=phone, status=status)`
  7. Retornar el objeto `driver` recién creado
- [ ] Envolver toda la operación en `with transaction.atomic():` para garantizar que si falla cualquier paso, ningún cambio queda guardado en la base de datos

**Verificación**: desde Django shell, llamar `create_driver({...})` con datos válidos y confirmar que se crea el `User`, el `Driver` y la asignación al grupo `driver`.

---

### T08 — `drivers/views.py`

- [ ] Reemplazar el contenido generado por `startapp` en `drivers/views.py`
- [ ] Importar: `status` de `rest_framework`, `Response` de `rest_framework.response`, `APIView` de `rest_framework.views`, `ModelViewSet` de `rest_framework.viewsets`, `AllowAny` e `IsAuthenticated` de `rest_framework.permissions`, `Driver` del modelo local, `DriverRegistrationSerializer` y `DriverSerializer` de los serializers locales, `create_driver` del service local
- [ ] Crear `DriverRegistrationView` extendiendo `APIView`:
  - `permission_classes = [AllowAny]` — este endpoint es **público**, no requiere token
  - Método `post(self, request)`:
    1. Instanciar `DriverRegistrationSerializer(data=request.data)`
    2. Llamar a `serializer.is_valid(raise_exception=True)` — DRF responde automáticamente con `400` si hay errores de validación
    3. Llamar a `create_driver(serializer.validated_data)` para obtener el `driver`
    4. Serializar el resultado con `DriverSerializer(driver)`
    5. Retornar `Response(serializer_out.data, status=status.HTTP_201_CREATED)`
- [ ] Crear `DriverViewSet` extendiendo `ModelViewSet`:
  - `queryset = Driver.objects.select_related('user').all()`
  - `serializer_class = DriverSerializer`
  - `permission_classes = [IsAuthenticated]` — requiere token JWT
  - Sin acciones custom adicionales en el MVP
  - No agregar lógica de negocio en la vista — delegar siempre al service

**Verificación**: desde Django shell, importar `DriverRegistrationView` y `DriverViewSet` sin errores.

---

### T09 — `drivers/urls.py`

- [ ] Crear el archivo `drivers/urls.py` (no existe aún, `startapp` no lo genera)
- [ ] Registrar `DriverViewSet` usando `DefaultRouter` de DRF con el prefix `drivers`
- [ ] Agregar manualmente la URL del endpoint de registro público:

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DriverViewSet, DriverRegistrationView

router = DefaultRouter()
router.register(r'drivers', DriverViewSet)

urlpatterns = [
    path('drivers/register/', DriverRegistrationView.as_view(), name='driver-register'),
    path('', include(router.urls)),
]
```

**Importante**: la ruta de registro (`drivers/register/`) debe declararse **antes** de `include(router.urls)` para que tenga precedencia sobre la ruta `drivers/{pk}/` del router.

**Verificación**: el archivo existe y se puede importar sin errores.

---

### T10 — Incluir en `config/urls.py`

- [ ] Abrir `config/urls.py`
- [ ] Agregar el `include` de `drivers.urls` bajo el prefijo `/api/v1/`, después del include de `customers.urls`:

```python
path('api/v1/', include('drivers.urls')),
```

El archivo `config/urls.py` resultante debe quedar así:

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
]
```

**Verificación**: `python manage.py check` no reporta errores de URL.

---

### T11 — Crear y aplicar migraciones

- [ ] Ejecutar `python manage.py makemigrations drivers`
  - Debe generar `drivers/migrations/0001_initial.py`
  - Verificar que el archivo generado incluye: `OneToOneField → auth_user`, `license_number (unique)`, `license_type (choices)`, `phone`, `status (choices, default=AVAILABLE)`, `created_at`, `updated_at`
- [ ] Ejecutar `python manage.py migrate`
  - Debe aplicar `drivers.0001_initial` sin errores

**Verificación**: `python manage.py migrate --check` retorna sin pendientes. La tabla `drivers_driver` existe en `db.sqlite3`.

---

### T12 — Verificación integral de la Fase 5

- [ ] `python manage.py check` retorna "System check identified no issues"
- [ ] `python manage.py migrate --check` retorna sin pendientes
- [ ] Desde Django shell: `from drivers.models import Driver; print(Driver._meta.fields)` muestra todos los campos esperados incluyendo `user_id`, `license_number`, `license_type`, `phone`, `status`
- [ ] Desde Django shell: `print([c[0] for c in Driver.LicenseType.choices])` retorna `['A', 'B', 'C']`
- [ ] Desde Django shell: `print([c[0] for c in Driver.Status.choices])` retorna `['AVAILABLE', 'ON_ROUTE', 'OFF_DUTY']`
- [ ] Desde Django shell: `from drivers.serializers import DriverSerializer, DriverRegistrationSerializer; print(list(DriverSerializer().fields.keys()))` muestra `id`, `username`, `email`, `first_name`, `last_name`, `license_number`, `license_type`, `phone`, `status`, `created_at`, `updated_at` — **sin** `password`
- [ ] Desde Django shell: `from drivers.services import create_driver` se importa sin errores
- [ ] Con el servidor activo (iniciado manualmente por el usuario):
  - `POST /api/v1/drivers/register/` sin token retorna `201` con datos del conductor creado
  - `GET /api/v1/drivers/` sin token retorna `401`
  - `GET /api/v1/drivers/` con token JWT válido retorna `200`

---

## Endpoints resultantes

| Método | URL | Auth requerida | Descripción |
|---|---|---|---|
| POST | `/api/v1/drivers/register/` | No (`AllowAny`) | Registro público de nuevo conductor |
| GET | `/api/v1/drivers/` | Sí (JWT Bearer) | Listar todos los conductores (paginado) |
| POST | `/api/v1/drivers/` | Sí (JWT Bearer) | Crear conductor (uso interno/admin) |
| GET | `/api/v1/drivers/{id}/` | Sí (JWT Bearer) | Obtener un conductor por ID |
| PUT | `/api/v1/drivers/{id}/` | Sí (JWT Bearer) | Actualizar todos los campos del perfil |
| PATCH | `/api/v1/drivers/{id}/` | Sí (JWT Bearer) | Actualizar campos parcialmente |
| DELETE | `/api/v1/drivers/{id}/` | Sí (JWT Bearer) | Eliminar un conductor |

**Ejemplo de body para `POST /api/v1/drivers/register/`:**
```json
{
  "username": "cmendoza",
  "email": "cmendoza@logistica.com",
  "password": "Contraseña.Segura123",
  "first_name": "Carlos",
  "last_name": "Mendoza",
  "license_number": "Q12345678",
  "license_type": "B",
  "phone": "+51 987 654 321"
}
```

**Ejemplo de respuesta exitosa `201 Created`:**
```json
{
  "id": 1,
  "username": "cmendoza",
  "email": "cmendoza@logistica.com",
  "first_name": "Carlos",
  "last_name": "Mendoza",
  "license_number": "Q12345678",
  "license_type": "B",
  "phone": "+51 987 654 321",
  "status": "AVAILABLE",
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T10:00:00Z"
}
```

Nótese que `password` **no aparece** en la respuesta.

---

## Validaciones de negocio

- `username` debe ser único en `auth_user` — validado en `DriverRegistrationSerializer.validate_username()`; retorna `400` con `{"username": ["..."]}`
- `email` debe ser único en `auth_user` — validado en `DriverRegistrationSerializer.validate_email()`; retorna `400` con `{"email": ["..."]}`
- `license_number` debe ser único en `drivers_driver` — validado en `DriverRegistrationSerializer.validate_license_number()`; retorna `400` con `{"license_number": ["..."]}`
- `license_type` debe ser uno de `A`, `B`, `C` — `ChoiceField` lo valida automáticamente; retorna `400` si el valor no está en los choices
- `status` debe ser uno de `AVAILABLE`, `ON_ROUTE`, `OFF_DUTY` — `ChoiceField` lo valida automáticamente; si no se proporciona, el default es `AVAILABLE`
- `password` nunca debe exponerse en ninguna respuesta — `write_only=True` en el serializer de registro; ausente en `DriverSerializer`
- La creación de `Driver` es atómica: si falla cualquier paso (crear `auth_user`, asignar grupo, crear perfil), toda la operación se revierte
- El grupo `driver` debe existir en la base de datos antes de que se ejecute `create_driver()` — si no existe, `services.py` lanza `ValidationError` con mensaje descriptivo

---

## Notas al Implement Agent

1. **La app vive en la raíz del proyecto**, no bajo `apps/`. Registrar como `'drivers'` en `INSTALLED_APPS`, no como `'apps.drivers'`.

2. **`serializers.py` y `urls.py` no los genera `startapp`**: deben crearse manualmente. No omitirlos.

3. **Dos serializers en el mismo archivo**: `DriverRegistrationSerializer` (escritura, registro público) y `DriverSerializer` (lectura, respuesta). Son clases distintas con propósitos distintos — no intentar unificarlos en uno solo.

4. **`DriverRegistrationSerializer` no extiende `ModelSerializer`**: combina campos de `auth_user` y `Driver`. Usar `serializers.Serializer` como base y declarar todos los campos manualmente.

5. **`password` es `write_only=True` en `DriverRegistrationSerializer`** y **no existe en `DriverSerializer`**: cualquier serializer que exponga `password` (así sea hasheado) es un error de implementación.

6. **`create_user` en lugar de `create`**: usar `User.objects.create_user()` para que Django hashee el password. Usar `create()` guardará el password en texto plano — error crítico de seguridad.

7. **Transacción atómica en `services.py`**: envolver la lógica de `create_driver()` con `with transaction.atomic():`. Si falla la asignación de grupo o la creación del `Driver`, el `User` tampoco debe quedar guardado.

8. **El grupo `driver` debe existir antes de llamar a `create_driver()`**: este grupo se crea en la Fase 1 (script o migración de datos). Si la Fase 1 no lo creó, `Group.objects.get(name='driver')` lanzará `DoesNotExist`. Manejar con try/except y relanzar como `ValidationError`.

9. **`select_related('user')` en el queryset del ViewSet**: el queryset de `DriverViewSet` debe ser `Driver.objects.select_related('user').all()` para evitar N+1 queries al serializar `username`, `email`, `first_name`, `last_name`.

10. **Orden en `urls.py`**: la ruta `drivers/register/` debe declararse **antes** de `include(router.urls)`. Si se declara después, el router podría interpretar `register` como el `{pk}` de un `GET /drivers/{pk}/` y nunca llegar a la vista de registro.

11. **`AllowAny` solo para `/register/`**: el `DriverViewSet` hereda `IsAuthenticated` de `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']`. No sobreescribir `permission_classes` en el ViewSet — solo hacerlo en `DriverRegistrationView`.

12. **`LicenseType` y `Status` como clases internas de `Driver`**: definir ambas `TextChoices` dentro de la clase del modelo para facilitar las referencias `Driver.LicenseType.choices` y `Driver.Status.AVAILABLE` desde serializers y services sin crear importaciones circulares.

13. **`status` con default `AVAILABLE`**: el campo `status` en el modelo usa `default=Status.AVAILABLE`. En `DriverRegistrationSerializer`, `status` es `required=False`; en `create_driver()` se usa `data.get('status', Driver.Status.AVAILABLE)` para respetar ese mismo default si el cliente no lo envía.

14. **`license_number` con `unique=True`** en el modelo y validación adicional en el serializer: el constraint de DB es la red de seguridad, pero la validación en `validate_license_number()` proporciona un mensaje de error legible antes de llegar a la DB.

15. **Esta app será referenciada como FK en la Fase 9 (`shipments`)**: no renombrar ni mover el modelo `Driver` después de crear la primera migración sin hacer una migración de renombrado.

16. **Los campos `username`, `email`, `first_name`, `last_name` en `DriverSerializer` son de solo lectura** (usan `source='user.username'`, etc.). No son editables vía `PUT /drivers/{id}/` — para cambiar datos del `auth_user` se requeriría lógica adicional fuera del MVP.
