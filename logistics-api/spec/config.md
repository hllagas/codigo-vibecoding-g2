# Spec: Fase 1 — Configuración base

## Contexto

Fase de infraestructura que prepara el proyecto Django para el desarrollo de todos los módulos posteriores. No produce modelos de negocio propios; su resultado es un entorno completamente funcional: variables de entorno seguras, DRF + JWT configurados, grupos de permisos creados y migraciones iniciales aplicadas.

Todas las fases siguientes (2–9) dependen de que esta fase esté completa.

## Dependencias

Ninguna. Es la fase raíz del proyecto.

## Estado actual del repositorio

| Elemento | Estado |
|---|---|
| `SECRET_KEY` | Hardcodeado en `config/settings.py` — debe moverse a `.env` |
| `DEBUG` | Hardcodeado en `config/settings.py` como `True` |
| `DATABASES` | SQLite hardcodeado sin decouple |
| `INSTALLED_APPS` | Solo apps built-in de Django; falta `rest_framework`, `rest_framework.authtoken`, `corsheaders`, apps del proyecto |
| `REST_FRAMEWORK` | No configurado en `settings.py` |
| `djangorestframework-simplejwt` | No está en `requirements.txt` ni instalado |
| `django-cors-headers` | No está en `requirements.txt` ni instalado |
| `config/urls.py` | Solo contiene `admin/`; falta el prefijo `/api/v1/` y los endpoints JWT |
| `products/apps.py` | `name = 'products'` — debe ser `'apps.products'` si se mueve a `apps/`, o bien se mantiene en raíz y se registra como `'products'` |
| `products/` | Scaffold vacío (sin modelos, vistas, URLs); no está en `INSTALLED_APPS` |
| `.env` | No existe — debe crearse |
| `python-decouple` | Ya en `requirements.txt` |
| `psycopg2-binary` | Ya en `requirements.txt` |

## Tareas

### T01 — Instalar dependencias faltantes

- [ ] Agregar `djangorestframework-simplejwt` a `requirements.txt`
- [ ] Agregar `django-cors-headers` a `requirements.txt`
- [ ] Ejecutar `pip install djangorestframework-simplejwt django-cors-headers` con el entorno virtual activo

**Verificacion**: `pip show djangorestframework-simplejwt django-cors-headers` muestra ambos paquetes instalados.

---

### T02 — Crear archivo `.env`

- [ ] Crear `.env` en la raiz del proyecto (`logistics-api/.env`) con las siguientes variables:

```ini
SECRET_KEY=cambiar-en-produccion
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

- [ ] Verificar que `.env` esta listado en `.gitignore` (no debe commitearse)

**Verificacion**: El archivo `.env` existe y no aparece en `git status` como archivo a trackear.

---

### T03 — Actualizar `config/settings.py`

Reemplazar el contenido actual por la configuracion completa. Los cambios especificos son:

#### T03.1 — Import de decouple

- [ ] Agregar al inicio del archivo:
  ```python
  from decouple import config
  ```

#### T03.2 — SECRET_KEY, DEBUG, ALLOWED_HOSTS via decouple

- [ ] Reemplazar las tres variables hardcodeadas:
  ```python
  SECRET_KEY = config('SECRET_KEY')
  DEBUG = config('DEBUG', cast=bool, default=False)
  ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')
  ```

#### T03.3 — INSTALLED_APPS completo

- [ ] Reemplazar `INSTALLED_APPS` por la lista completa en el siguiente orden:
  1. Apps built-in de Django (las actuales, sin cambios)
  2. `'corsheaders'`
  3. `'rest_framework'`
  4. `'rest_framework.authtoken'`
  5. `'rest_framework_simplejwt'`
  6. `'products'` — app existente en raiz (mantener como `'products'` mientras no se mueva a `apps/`)

**Nota**: Las apps de negocio (`customers`, `suppliers`, etc.) se agregan en sus respectivas fases. No agregarlas aqui.

#### T03.4 — MIDDLEWARE con CORS

- [ ] Agregar `'corsheaders.middleware.CorsMiddleware'` como **primer elemento** de `MIDDLEWARE`, antes de `SecurityMiddleware`:
  ```python
  MIDDLEWARE = [
      'corsheaders.middleware.CorsMiddleware',
      'django.middleware.security.SecurityMiddleware',
      ...  # resto sin cambios
  ]
  ```

#### T03.5 — DATABASES via decouple

- [ ] Reemplazar el bloque `DATABASES` hardcodeado por:
  ```python
  DATABASES = {
      'default': {
          'ENGINE': config('DB_ENGINE', default='django.db.backends.sqlite3'),
          'NAME': config('DB_NAME', default=BASE_DIR / 'db.sqlite3'),
      }
  }
  ```

#### T03.6 — REST_FRAMEWORK

- [ ] Agregar el bloque `REST_FRAMEWORK` al final del archivo:
  ```python
  REST_FRAMEWORK = {
      'DEFAULT_AUTHENTICATION_CLASSES': [
          'rest_framework_simplejwt.authentication.JWTAuthentication',
      ],
      'DEFAULT_PERMISSION_CLASSES': [
          'rest_framework.permissions.IsAuthenticated',
      ],
      'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
      'PAGE_SIZE': 20,
  }
  ```

#### T03.7 — CORS

- [ ] Agregar configuracion CORS al final del archivo:
  ```python
  CORS_ALLOWED_ORIGINS = config(
      'CORS_ALLOWED_ORIGINS',
      default='http://localhost:3000,http://localhost:5173'
  ).split(',')
  ```

**Verificacion**: `python manage.py check` no reporta errores. `python manage.py shell -c "from django.conf import settings; print(settings.SECRET_KEY)"` no imprime la clave hardcodeada original.

---

### T04 — Actualizar `config/urls.py`

- [ ] Reemplazar el contenido de `config/urls.py` por la configuracion con prefijo `/api/v1/` y endpoints JWT:

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
]
```

**Nota sobre logout**: `TokenBlacklistView` requiere que `'rest_framework_simplejwt.token_blacklist'` este en `INSTALLED_APPS`. Ver T05.

**Verificacion**: `python manage.py show_urls` (si django-extensions esta instalado) o revisar que las rutas aparecen al navegar a `/api/v1/auth/login/` con el servidor activo.

---

### T05 — Habilitar token blacklist para logout

- [ ] Agregar `'rest_framework_simplejwt.token_blacklist'` a `INSTALLED_APPS` en `config/settings.py`, despues de `'rest_framework_simplejwt'`:
  ```python
  'rest_framework_simplejwt',
  'rest_framework_simplejwt.token_blacklist',
  ```

**Verificacion**: `python manage.py migrate` no lanza `LookupError` por app no registrada.

---

### T06 — Ejecutar migraciones iniciales

- [ ] Ejecutar `python manage.py migrate`

Esto crea todas las tablas built-in de Django:
- `auth_user`, `auth_group`, `auth_permission`, `auth_user_groups`, `auth_user_user_permissions`
- `django_admin_log`, `django_content_type`, `django_session`
- `authtoken_token` (de `rest_framework.authtoken`)
- Tablas de `rest_framework_simplejwt.token_blacklist`

**Verificacion**: El comando termina sin errores. `db.sqlite3` existe y tiene peso mayor a 0 bytes.

---

### T07 — Crear management command para grupos de permisos

- [ ] Crear la estructura de directorios para el management command:
  ```
  config/
  └── management/
      ├── __init__.py
      └── commands/
          ├── __init__.py
          └── create_groups.py
  ```

- [ ] Implementar `create_groups.py` como management command que crea (o verifica existencia de) los cuatro grupos:
  - `admin`
  - `operator`
  - `driver`
  - `customer`

  El command usa `Group.objects.get_or_create(name=...)` para ser idempotente (puede ejecutarse multiples veces sin error).

- [ ] Ejecutar `python manage.py create_groups`

**Verificacion**: El comando termina con mensaje de confirmacion para cada grupo. Ejecutarlo dos veces no lanza errores ni crea duplicados. En Django shell: `from django.contrib.auth.models import Group; print(Group.objects.values_list('name', flat=True))` muestra los cuatro grupos.

---

### T08 — Verificacion integral de la Fase 1

- [ ] `python manage.py check` retorna "System check identified no issues"
- [ ] `python manage.py migrate --check` retorna sin pendientes
- [ ] `python manage.py shell -c "from rest_framework_simplejwt.tokens import RefreshToken; print('JWT OK')"` imprime "JWT OK"
- [ ] Los cuatro grupos (`admin`, `operator`, `driver`, `customer`) existen en la DB
- [ ] `.env` no aparece trackeado por git

---

## Endpoints resultantes de la Fase 1

| Metodo | URL | Descripcion | Autenticacion |
|---|---|---|---|
| POST | `/api/v1/auth/login/` | Obtener access + refresh token | Publica |
| POST | `/api/v1/auth/refresh/` | Renovar access token con refresh token | Publica |
| POST | `/api/v1/auth/logout/` | Invalidar refresh token (blacklist) | Requiere refresh token valido |

Formato de respuesta de login:
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}
```

Todas las rutas de negocio de fases posteriores requeriran:
```
Authorization: Bearer <access_token>
```

---

## Validaciones de negocio

No hay logica de negocio en esta fase. Las reglas que aplican son de configuracion:

- `SECRET_KEY` nunca debe ser el valor hardcodeado original en produccion
- `DEBUG=False` en produccion (Railway)
- `ALLOWED_HOSTS` debe incluir el dominio Railway en produccion
- Los grupos de permisos deben existir antes de que las apps de negocio (`customers`, `drivers`) los asignen a usuarios

---

## Notas al Implement Agent

1. **Orden de INSTALLED_APPS importa**: `corsheaders` debe aparecer antes de las apps de DRF para que el middleware funcione correctamente.

2. **CorsMiddleware va primero en MIDDLEWARE**: debe ser el primer middleware de la lista, antes de `SecurityMiddleware`, para que intercepte las preflight requests.

3. **`products/apps.py` tiene `name = 'products'`** (no `'apps.products'`): la app `products` esta en la raiz del proyecto, no en `apps/`. Registrar en `INSTALLED_APPS` como `'products'`, no como `'apps.products'`. Las apps de negocio nuevas que se creen en fases posteriores deben seguir el mismo patron de raiz o moverse todas a `apps/` de forma consistente. Esta decision de arquitectura debe mantenerse uniforme.

4. **`TokenBlacklistView` requiere T05**: si se configura la URL de logout antes de agregar `rest_framework_simplejwt.token_blacklist` a `INSTALLED_APPS` y ejecutar `migrate`, el servidor falla al iniciar con `LookupError`. Ejecutar en el orden T03 → T04 → T05 → T06.

5. **`DB_NAME` con `BASE_DIR`**: en SQLite, `DB_NAME` es una ruta de archivo. Con decouple, el valor de `.env` es un string; para desarrollo local es suficiente con `'db.sqlite3'` (ruta relativa al directorio de ejecucion). En produccion con PostgreSQL, `DB_ENGINE` y `DB_NAME` cambiaran a los valores de Railway.

6. **El management command `create_groups` debe vivir bajo `config/management/`**: como `config/` no es una app Django registrada (no tiene `AppConfig`), el command debe declararse con el `app_label` correcto o alternativamente crearse bajo una app registrada. Si Django no encuentra el command en `config/`, moverlo a `products/management/commands/create_groups.py` como alternativa temporal hasta que exista una app adecuada.

7. **Sin endpoint `/api/v1/auth/register/`** en esta fase: el registro de usuarios se implementa en las fases de `customers` (Fase 4) y `drivers` (Fase 5), donde cada uno crea su propio `auth_user` junto con el perfil de negocio.
