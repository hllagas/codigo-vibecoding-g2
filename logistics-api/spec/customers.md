# Spec: Fase 4 — `customers`

## Contexto

App Django independiente que gestiona los clientes de la plataforma logística. Un cliente es la empresa o persona que genera envíos. A diferencia de `warehouses` y `suppliers`, esta app **extiende `auth_user`** mediante `OneToOneField` para no duplicar datos de autenticación — el cliente puede hacer login en el sistema.

La creación de un `Customer` implica crear primero un `auth_user` y luego el perfil extendido, con asignación automática al grupo `customer`. Esta lógica vive exclusivamente en `services.py`.

La tabla resultante (`customers_customer`) será referenciada como FK en `shipments_shipment` (Fase 9). Esta app debe quedar completamente funcional antes de avanzar a esa fase.

**Nota de arquitectura**: la app vive en la raíz del proyecto (mismo nivel que `products/`, `warehouses/`, `suppliers/` y `manage.py`), no bajo `apps/`. Se registra como `'customers'` en `INSTALLED_APPS`, coherente con el patrón establecido en las fases anteriores.

**Endpoint especial**: `POST /api/v1/customers/register/` es **público** (`AllowAny`) para permitir el autoregistro de clientes. El resto de endpoints del CRUD requieren autenticación JWT.

## Dependencias

- **Fase 1** completada: `config/settings.py` con `REST_FRAMEWORK`, JWT configurado, grupos de permisos creados (`admin`, `operator`, `driver`, `customer`), migraciones iniciales aplicadas.
- `auth_user` (tabla built-in de Django) debe existir — se garantiza con cualquier migración inicial.
- No depende de `warehouses`, `suppliers` ni ninguna otra app del proyecto.

---

## Tareas

### T01 — Crear la app `customers`

- [ ] Ejecutar `python manage.py startapp customers` en la raíz del proyecto (mismo nivel que `products/`, `warehouses/`, `suppliers/` y `manage.py`)
- [ ] Verificar que se creó el directorio `customers/` con la estructura estándar de Django: `models.py`, `views.py`, `apps.py`, `tests.py`, `admin.py`, `migrations/`

**Verificación**: el directorio `customers/` existe en la raíz del proyecto.

---

### T02 — `customers/apps.py`

- [ ] Abrir `customers/apps.py` generado por `startapp`
- [ ] Verificar que `name = 'customers'` (no `'apps.customers'`, la app vive en la raíz)
- [ ] Verificar que `default_auto_field = 'django.db.models.BigAutoField'`

El archivo debe quedar exactamente así:

```python
from django.apps import AppConfig


class CustomersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'customers'
```

**Verificación**: `name` es `'customers'`.

---

### T03 — Registrar en `INSTALLED_APPS`

- [ ] Abrir `config/settings.py`
- [ ] Agregar `'customers'` a `INSTALLED_APPS`, después de `'suppliers'` y antes de cualquier app que dependa de ella:

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
    'customers',   # ← agregar aquí
]
```

**Verificación**: `python manage.py check` no reporta errores relacionados con apps no registradas.

---

### T04 — `customers/models.py`

- [ ] Importar `settings` de `django.conf` y `User` de `django.contrib.auth.models` (o usar `settings.AUTH_USER_MODEL` como referencia en la FK)
- [ ] Crear el modelo `Customer` con todos los campos del schema `customers_customer`:

| Campo | Tipo Django | Restricciones |
|---|---|---|
| `user` | `OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_profile')` | único, requerido |
| `company_name` | `CharField(max_length=200)` | `null=True, blank=True` |
| `tax_id` | `CharField(max_length=20)` | `unique=True, null=True, blank=True` |
| `phone` | `CharField(max_length=20)` | requerido |
| `address` | `TextField()` | requerido |
| `city` | `CharField(max_length=100)` | requerido |
| `country` | `CharField(max_length=100)` | requerido |
| `created_at` | `DateTimeField(auto_now_add=True)` | automático |
| `updated_at` | `DateTimeField(auto_now=True)` | automático |

- [ ] Agregar clase `Meta` con:
  - `ordering = ['user__last_name', 'user__first_name']`
  - `verbose_name = 'customer'`
  - `verbose_name_plural = 'customers'`
- [ ] Agregar método `__str__` que retorne `f"{self.user.get_full_name()} ({self.user.email})"`

**Verificación**: `python manage.py check` no reporta errores de modelos. `python manage.py makemigrations --check customers` detecta cambios pendientes.

---

### T05 — `customers/serializers.py` — Serializer de escritura (registro)

- [ ] Crear el archivo `customers/serializers.py` (no existe aún, `startapp` no lo genera)
- [ ] Crear `CustomerRegistrationSerializer` extendiendo `serializers.Serializer` (no `ModelSerializer`, porque combina campos de dos modelos):
  - **Campos del `auth_user`** (todos `write_only=False` salvo `password`):
    - `username` — `CharField(max_length=150)`, requerido
    - `email` — `EmailField(max_length=254)`, requerido
    - `password` — `CharField(max_length=128)`, `write_only=True`, requerido — **nunca debe aparecer en la respuesta**
    - `first_name` — `CharField(max_length=150)`, requerido
    - `last_name` — `CharField(max_length=150)`, requerido
  - **Campos del `Customer`**:
    - `phone` — `CharField(max_length=20)`, requerido
    - `address` — `CharField()` (usa `CharField` porque el modelo usa `TextField`), requerido
    - `city` — `CharField(max_length=100)`, requerido
    - `country` — `CharField(max_length=100)`, requerido
    - `company_name` — `CharField(max_length=200)`, `required=False, allow_blank=True, allow_null=True`
    - `tax_id` — `CharField(max_length=20)`, `required=False, allow_blank=True, allow_null=True`
- [ ] Agregar validación en `validate_username`: verificar que no existe ya un `User` con ese `username`; lanzar `serializers.ValidationError` si está duplicado
- [ ] Agregar validación en `validate_email`: verificar que no existe ya un `User` con ese `email`; lanzar `serializers.ValidationError` si está duplicado
- [ ] Agregar validación en `validate_tax_id`: verificar que no existe ya un `Customer` con ese `tax_id` (cuando el valor no es `None` ni cadena vacía); lanzar `serializers.ValidationError` si está duplicado
- [ ] No implementar `create()` en el serializer — la creación la maneja `services.create_customer(data)`

**Verificación**: importar `CustomerRegistrationSerializer` desde Django shell sin errores. Instanciar con datos válidos e inválidos para confirmar que `is_valid()` funciona.

---

### T06 — `customers/serializers.py` — Serializer de lectura

- [ ] En el mismo archivo `customers/serializers.py`, crear `CustomerSerializer` extendiendo `ModelSerializer`:
  - `Meta.model = Customer`
  - `Meta.fields` debe incluir explícitamente:
    - `id` — del modelo `Customer`
    - `username` — campo de solo lectura mapeado desde `user.username`
    - `email` — campo de solo lectura mapeado desde `user.email`
    - `first_name` — campo de solo lectura mapeado desde `user.first_name`
    - `last_name` — campo de solo lectura mapeado desde `user.last_name`
    - `company_name`
    - `tax_id`
    - `phone`
    - `address`
    - `city`
    - `country`
    - `created_at`
    - `updated_at`
  - `Meta.read_only_fields = ['id', 'created_at', 'updated_at']`
- [ ] Declarar los campos del `auth_user` como `SerializerMethodField` o como campos de fuente (`source`):
  - `username = serializers.CharField(source='user.username', read_only=True)`
  - `email = serializers.EmailField(source='user.email', read_only=True)`
  - `first_name = serializers.CharField(source='user.first_name', read_only=True)`
  - `last_name = serializers.CharField(source='user.last_name', read_only=True)`
- [ ] El campo `password` **nunca** debe aparecer en `CustomerSerializer` — ni en input ni en output

**Verificación**: instanciar `CustomerSerializer` con un `Customer` existente y confirmar que la respuesta incluye `username`, `email`, `first_name`, `last_name` y **no** incluye `password`.

---

### T07 — `customers/services.py`

- [ ] Crear el archivo `customers/services.py` (no existe aún)
- [ ] Importar `User` (o `get_user_model()`), `Group` de `django.contrib.auth.models`, y `Customer` del modelo local
- [ ] Implementar la función `create_customer(data)` con la siguiente lógica exacta, en orden:
  1. Extraer del dict `data` los campos del `auth_user`: `username`, `email`, `password`, `first_name`, `last_name`
  2. Extraer los campos del `Customer`: `phone`, `address`, `city`, `country`, `company_name` (puede ser `None`), `tax_id` (puede ser `None`)
  3. Crear el `auth_user` usando `User.objects.create_user(username, email, password, first_name=first_name, last_name=last_name)` — usar `create_user` (no `create`) para que el password se hashee correctamente
  4. Recuperar el grupo `customer` usando `Group.objects.get(name='customer')` — si el grupo no existe, lanzar `ValidationError` con mensaje descriptivo
  5. Asignar el usuario al grupo: `user.groups.add(group)`
  6. Crear el `Customer` con `Customer.objects.create(user=user, phone=phone, address=address, city=city, country=country, company_name=company_name, tax_id=tax_id)`
  7. Retornar el objeto `customer` recién creado
- [ ] Envolver toda la operación en una transacción atómica (`django.db.transaction.atomic`) para garantizar que si falla la creación del `Customer` o la asignación de grupo, el `auth_user` tampoco se guarda

**Verificación**: desde Django shell, llamar `create_customer({...})` con datos válidos y confirmar que se crea el `User`, el `Customer` y la asignación de grupo.

---

### T08 — `customers/views.py`

- [ ] Reemplazar el contenido generado por `startapp` en `customers/views.py`
- [ ] Importar: `ModelViewSet`, `APIView`, `Response`, `status`, `AllowAny`, `IsAuthenticated`, `CustomerRegistrationSerializer`, `CustomerSerializer`, `Customer`, `create_customer`
- [ ] Crear `CustomerRegistrationView` extendiendo `APIView`:
  - `permission_classes = [AllowAny]` — este endpoint es **público**, no requiere token
  - Método `post(self, request)`:
    1. Instanciar `CustomerRegistrationSerializer(data=request.data)`
    2. Llamar a `serializer.is_valid(raise_exception=True)` — DRF responde automáticamente con `400` si hay errores
    3. Llamar a `create_customer(serializer.validated_data)` para obtener el `customer`
    4. Serializar el resultado con `CustomerSerializer(customer)`
    5. Retornar `Response(serializer_out.data, status=status.HTTP_201_CREATED)`
- [ ] Crear `CustomerViewSet` extendiendo `ModelViewSet`:
  - `queryset = Customer.objects.select_related('user').all()`
  - `serializer_class = CustomerSerializer`
  - `permission_classes = [IsAuthenticated]` — requiere token JWT
  - Sin acciones custom adicionales en el MVP
  - No agregar lógica de negocio en la vista — delegar siempre al service

**Verificación**: desde Django shell, importar `CustomerRegistrationView` y `CustomerViewSet` sin errores.

---

### T09 — `customers/urls.py`

- [ ] Crear el archivo `customers/urls.py` (no existe aún, `startapp` no lo genera)
- [ ] Registrar `CustomerViewSet` usando `DefaultRouter` de DRF con el prefix `customers`
- [ ] Agregar manualmente la URL del endpoint de registro público:

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, CustomerRegistrationView

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('customers/register/', CustomerRegistrationView.as_view(), name='customer-register'),
    path('', include(router.urls)),
]
```

**Importante**: la ruta de registro (`customers/register/`) debe declararse **antes** de `include(router.urls)` para que tenga precedencia sobre la ruta `customers/{id}/` del router.

**Verificación**: el archivo existe y se puede importar sin errores.

---

### T10 — Incluir en `config/urls.py`

- [ ] Abrir `config/urls.py`
- [ ] Agregar el `include` de `customers.urls` bajo el prefijo `/api/v1/`:

```python
path('api/v1/', include('customers.urls')),
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
]
```

**Verificación**: `python manage.py check` no reporta errores de URL.

---

### T11 — Crear y aplicar migraciones

- [ ] Ejecutar `python manage.py makemigrations customers`
  - Debe generar `customers/migrations/0001_initial.py`
  - Verificar que el archivo generado incluye: `OneToOneField → auth_user`, `company_name`, `tax_id`, `phone`, `address`, `city`, `country`, `created_at`, `updated_at`
- [ ] Ejecutar `python manage.py migrate`
  - Debe aplicar `customers.0001_initial` sin errores

**Verificación**: `python manage.py migrate --check` retorna sin pendientes. La tabla `customers_customer` existe en `db.sqlite3`.

---

### T12 — Verificación integral de la Fase 4

- [ ] `python manage.py check` retorna "System check identified no issues"
- [ ] `python manage.py migrate --check` retorna sin pendientes
- [ ] Desde Django shell: `from customers.models import Customer; print(Customer._meta.fields)` muestra todos los campos esperados incluyendo `user_id`
- [ ] Desde Django shell: `from customers.serializers import CustomerSerializer, CustomerRegistrationSerializer; print(CustomerSerializer().fields.keys())` muestra `username`, `email`, `first_name`, `last_name`, `company_name`, `tax_id`, `phone`, `address`, `city`, `country`, `created_at`, `updated_at` — **sin** `password`
- [ ] Desde Django shell: `from customers.services import create_customer` se importa sin errores
- [ ] Con el servidor activo (iniciado manualmente por el usuario):
  - `POST /api/v1/customers/register/` sin token retorna `201` con datos del cliente creado
  - `GET /api/v1/customers/` sin token retorna `401`
  - `GET /api/v1/customers/` con token JWT válido retorna `200`

---

## Endpoints resultantes

| Método | URL | Auth requerida | Descripción |
|---|---|---|---|
| POST | `/api/v1/customers/register/` | No (`AllowAny`) | Registro público de nuevo cliente |
| GET | `/api/v1/customers/` | Si (JWT Bearer) | Listar todos los clientes (paginado) |
| POST | `/api/v1/customers/` | Si (JWT Bearer) | Crear cliente (uso interno/admin) |
| GET | `/api/v1/customers/{id}/` | Si (JWT Bearer) | Obtener un cliente por ID |
| PUT | `/api/v1/customers/{id}/` | Si (JWT Bearer) | Actualizar todos los campos del perfil |
| PATCH | `/api/v1/customers/{id}/` | Si (JWT Bearer) | Actualizar campos parcialmente |
| DELETE | `/api/v1/customers/{id}/` | Si (JWT Bearer) | Eliminar un cliente |

**Ejemplo de body para `POST /api/v1/customers/register/`:**
```json
{
  "username": "jperez",
  "email": "jperez@empresa.com",
  "password": "Contraseña.Segura123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+51 999 888 777",
  "address": "Av. República 456, Piso 3",
  "city": "Lima",
  "country": "Perú",
  "company_name": "Empresa S.A.C.",
  "tax_id": "20123456789"
}
```

**Ejemplo de respuesta exitosa `201 Created`:**
```json
{
  "id": 1,
  "username": "jperez",
  "email": "jperez@empresa.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "company_name": "Empresa S.A.C.",
  "tax_id": "20123456789",
  "phone": "+51 999 888 777",
  "address": "Av. República 456, Piso 3",
  "city": "Lima",
  "country": "Perú",
  "created_at": "2026-05-26T10:00:00Z",
  "updated_at": "2026-05-26T10:00:00Z"
}
```

Nótese que `password` **no aparece** en la respuesta.

---

## Validaciones de negocio

- `username` debe ser único en `auth_user` — validado en `CustomerRegistrationSerializer.validate_username()`; retorna `400` con `{"username": ["..."]}`
- `email` debe ser único en `auth_user` — validado en `CustomerRegistrationSerializer.validate_email()`; retorna `400` con `{"email": ["..."]}`
- `tax_id` debe ser único en `customers_customer` cuando se proporciona — validado en `CustomerRegistrationSerializer.validate_tax_id()`; retorna `400` con `{"tax_id": ["..."]}`
- `password` nunca debe exponerse en ninguna respuesta — `write_only=True` en el serializer de registro; ausente en `CustomerSerializer`
- La creación de `Customer` es atómica: si falla cualquier paso (crear `auth_user`, asignar grupo, crear perfil), toda la operación se revierte
- El grupo `customer` debe existir en la base de datos antes de que se ejecute `create_customer()` — si no existe, `services.py` lanza `ValidationError` con mensaje descriptivo
- `company_name` y `tax_id` son opcionales (`nullable`) — el serializer de registro los acepta como `required=False, allow_null=True, allow_blank=True`

---

## Notas al Implement Agent

1. **La app vive en la raíz del proyecto**, no bajo `apps/`. Registrar como `'customers'` en `INSTALLED_APPS`, no como `'apps.customers'`.

2. **`serializers.py` y `urls.py` no los genera `startapp`**: deben crearse manualmente. No omitirlos.

3. **Dos serializers en el mismo archivo**: `CustomerRegistrationSerializer` (escritura, registro público) y `CustomerSerializer` (lectura, respuesta). Son clases distintas con propósitos distintos — no intentar unificarlos en uno solo.

4. **`CustomerRegistrationSerializer` no extiende `ModelSerializer`**: combina campos de `auth_user` y `Customer`. Usar `serializers.Serializer` como base y declarar todos los campos manualmente.

5. **`password` es `write_only=True` en `CustomerRegistrationSerializer`** y **no existe en `CustomerSerializer`**: cualquier serializer que exponga `password` (así sea hasheado) es un error de implementación.

6. **`create_user` en lugar de `create`**: usar `User.objects.create_user()` para que Django hashee el password. Usar `create()` guardará el password en texto plano — error crítico de seguridad.

7. **Transacción atómica en `services.py`**: envolver la lógica de `create_customer()` con `@transaction.atomic` o `with transaction.atomic():`. Si falla la asignación de grupo o la creación del `Customer`, el `User` tampoco debe quedar guardado.

8. **El grupo `customer` debe existir antes de llamar a `create_customer()`**: este grupo se crea en la Fase 1 (script o migración de datos). Si la Fase 1 no lo creó, `Group.objects.get(name='customer')` lanzará `DoesNotExist`. Manejar con try/except y relanzar como `ValidationError`.

9. **`select_related('user')` en el queryset del ViewSet**: el queryset de `CustomerViewSet` debe ser `Customer.objects.select_related('user').all()` para evitar N+1 queries al serializar `username`, `email`, `first_name`, `last_name`.

10. **Orden en `urls.py`**: la ruta `customers/register/` debe declararse **antes** de `include(router.urls)`. Si se declara después, el router podría interpretar `register` como el `{pk}` de un `GET /customers/{pk}/` y nunca llegar a la vista de registro.

11. **`AllowAny` solo para `/register/`**: el resto de los endpoints del `CustomerViewSet` heredan `IsAuthenticated` de `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']`. No sobreescribir `permission_classes` en el ViewSet — solo hacerlo en `CustomerRegistrationView`.

12. **`tax_id` con `unique=True, null=True`**: en SQLite y PostgreSQL, múltiples filas pueden tener `NULL` en una columna con `unique=True` sin violar la restricción de unicidad. Esto es comportamiento correcto y esperado — no agregar validación adicional para el caso `null`.

13. **Esta app será referenciada como FK en la Fase 9 (`shipments`)**: no renombrar ni mover el modelo `Customer` después de crear la primera migración sin hacer una migración de renombrado.

14. **Los campos `username`, `email`, `first_name`, `last_name` en `CustomerSerializer` son de solo lectura** (usan `source='user.username'`, etc.). No son editables vía `PUT /customers/{id}/` — para cambiar datos del `auth_user` se requeriría lógica adicional fuera del MVP.
