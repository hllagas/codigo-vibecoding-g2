# Phase 1 — Setup base del proyecto

## Contexto

El proyecto `logistica-api` es una API REST de gestión logística construida con Django 6.0 y Django REST Framework 3.17. El repositorio ya tiene el esqueleto generado por `django-admin startproject`, pero aún no está configurado para DRF, JWT ni documentación OpenAPI. Esta fase establece toda la infraestructura base sobre la que se construirán las 8 apps de dominio en fases posteriores.

Estado inicial relevante:
- `config/settings.py`: `SECRET_KEY` hardcodeado en texto plano, `DEBUG` hardcodeado como `True`, `DATABASES` apuntando a SQLite sin leer variables de entorno, `INSTALLED_APPS` sin ninguna dependencia de terceros.
- `config/urls.py`: solo registra `admin/`, sin rutas de JWT ni de documentación.
- `requirements.txt`: contiene `Django`, `djangorestframework`, `psycopg2-binary`, `python-decouple`, `asgiref`, `sqlparse`, `tzdata`. Faltan las tres dependencias nuevas.
- No existe archivo `.env` ni `.env.example`.

---

## Dependencias nuevas a incorporar

| Paquete | Versión target | Rol |
|---|---|---|
| `djangorestframework-simplejwt` | `5.x` | Autenticación JWT (access + refresh token) |
| `django-filter` | `24.x` | Filtrado declarativo en ViewSets |
| `drf-spectacular` | `0.27.x` | Generación automática de schema OpenAPI 3 |

---

## Tareas

### TASK-01 — Agregar las tres dependencias nuevas a `requirements.txt`

Agregar al archivo `requirements.txt` las entradas para `djangorestframework-simplejwt`, `django-filter` y `drf-spectacular` con sus respectivos rangos de versión indicados en `docs/architecture.md`. Las líneas deben seguir el mismo estilo de pinado que el resto del archivo (paquete==versión).

Criterio de completitud: `requirements.txt` contiene las 10 dependencias (7 existentes + 3 nuevas) y el archivo puede ser procesado por `pip install -r requirements.txt` sin errores de sintaxis.

---

### TASK-02 — Crear el archivo `.env.example`

Crear el archivo `.env.example` en la raíz del proyecto (`logistica-api/`) con las siguientes variables de entorno documentadas pero sin valores reales:

- `SECRET_KEY` — clave secreta de Django (valor de ejemplo: una cadena aleatoria de marcador de posición).
- `DEBUG` — booleano que controla el modo debug (`True` en desarrollo, `False` en producción).
- `DATABASE_URL` — cadena de conexión completa a la base de datos. Incluir dos líneas comentadas: una para SQLite local y otra para PostgreSQL/NeonDB en producción, con el formato estándar de cada proveedor (p. ej. `sqlite:///./db.sqlite3` y `postgres://user:password@host:5432/dbname`).

El archivo debe ser legible por cualquier desarrollador que clone el repositorio y quiera crear su propio `.env`.

Criterio de completitud: el archivo existe, contiene las tres variables, y los comentarios explican el propósito de cada una.

---

### TASK-03 — Migrar `SECRET_KEY` y `DEBUG` a `python-decouple` en `settings.py`

En `config/settings.py`, reemplazar las asignaciones literales de `SECRET_KEY` y `DEBUG` por llamadas a `config()` de `python-decouple`:

- `SECRET_KEY` debe leerse como string obligatorio (sin valor por defecto, para forzar que exista en `.env` en producción).
- `DEBUG` debe leerse como booleano usando el cast `bool` que provee decouple, con valor por defecto `False`.
- Agregar el import de `config` (y `Csv` si se necesitara para `ALLOWED_HOSTS` en el futuro) al inicio del archivo, después de la importación de `Path`.

El valor hardcodeado `'django-insecure-z2j#g=...'` debe eliminarse del archivo.

Criterio de completitud: `settings.py` no contiene ninguna clave secreta en texto plano y los dos valores se leen desde el entorno.

---

### TASK-04 — Configurar `DATABASES` con `DATABASE_URL` via `python-decouple`

Reemplazar el bloque `DATABASES` actual (que apunta fijo a SQLite) por una configuración que lea `DATABASE_URL` desde el entorno usando `python-decouple`. La lógica debe:

- Leer `DATABASE_URL` con un valor por defecto de `sqlite:///./db.sqlite3` para que el entorno de desarrollo funcione sin configuración adicional.
- Parsear esa URL para construir el diccionario `DATABASES['default']` usando `dj-database-url` o derivando el motor manualmente desde el esquema de la URL.

> Nota para el implementador: `dj-database-url` no está en `requirements.txt`. Si se opta por esta librería, debe agregarse en TASK-01. Alternativamente, `python-decouple` puede usarse en combinación con parsing manual. La arquitectura del proyecto en `docs/architecture.md` indica que se usa `python-decouple` para toda la configuración; elegir el enfoque más simple que no introduzca dependencias extra si se puede evitar.

Criterio de completitud: con `DATABASE_URL=sqlite:///./db.sqlite3` en `.env`, el proyecto arranca y `python manage.py migrate` crea el schema sin errores. Con una URL de PostgreSQL válida en `DATABASE_URL`, el proyecto se conecta a Postgres.

---

### TASK-05 — Agregar las apps de terceros a `INSTALLED_APPS`

En `config/settings.py`, agregar las siguientes entradas a la lista `INSTALLED_APPS`, después de las apps nativas de Django:

- `'rest_framework'`
- `'rest_framework_simplejwt'`
- `'drf_spectacular'`
- `'django_filters'`

El orden dentro de `INSTALLED_APPS` no es crítico para estas apps, pero por convención se agrupan las apps de terceros entre las apps nativas de Django y las apps propias del proyecto.

Criterio de completitud: `python manage.py check` no reporta errores relacionados con apps no encontradas.

---

### TASK-06 — Agregar el bloque `REST_FRAMEWORK` a `settings.py`

Agregar en `config/settings.py` el bloque de configuración `REST_FRAMEWORK` con exactamente los siguientes parámetros, tal como se especifica en `docs/architecture.md`:

- `DEFAULT_AUTHENTICATION_CLASSES`: lista con una sola entrada — `JWTAuthentication` de `rest_framework_simplejwt.authentication`.
- `DEFAULT_PERMISSION_CLASSES`: lista con una sola entrada — `IsAuthenticated` de `rest_framework.permissions`.
- `DEFAULT_PAGINATION_CLASS`: `PageNumberPagination` de `rest_framework.pagination`.
- `PAGE_SIZE`: `20`.
- `DEFAULT_FILTER_BACKENDS`: lista con tres entradas en orden — `DjangoFilterBackend` de `django_filters.rest_framework`, `SearchFilter` y `OrderingFilter` de `rest_framework.filters`.
- `DEFAULT_SCHEMA_CLASS`: `AutoSchema` de `drf_spectacular.openapi`.

El bloque debe ubicarse al final de `settings.py`, después del bloque de archivos estáticos, para mantener el archivo ordenado por secciones.

Criterio de completitud: `python manage.py spectacular --validate` no produce errores de configuración.

---

### TASK-07 — Actualizar `config/urls.py` con rutas JWT y de documentación

Reemplazar el contenido actual de `config/urls.py` por una configuración que registre:

1. `admin/` — mantener el registro existente.
2. `api/v1/auth/` — incluir las URLs de `rest_framework_simplejwt`, que expone `token/` (obtener par de tokens) y `token/refresh/` (renovar access token). Importar con `include('rest_framework_simplejwt.urls')`.
3. `api/v1/` — dejar un bloque `include()` con lista vacía o comentario explícito indicando que aquí se incluirán las URLs de cada app de dominio a medida que se implementen en fases 2–8. No incluir ninguna app que no exista aún.
4. `api/schema/` — vista `SpectacularAPIView` de `drf_spectacular.views`, con `name='schema'`.
5. `api/docs/` — vista `SpectacularSwaggerView` de `drf_spectacular.views`, con `url_name='schema'` y `name='swagger-ui'`.

Los imports necesarios son: `path` e `include` de `django.urls`, `admin` de `django.contrib`, `SpectacularAPIView` y `SpectacularSwaggerView` de `drf_spectacular.views`.

La estructura del bloque `api/v1/` debe usar `include([...])` con lista inline, siguiendo el patrón de `docs/architecture.md`, para facilitar agregar apps futuras sin modificar la estructura exterior.

Criterio de completitud: `python manage.py check` no reporta errores, `GET /api/schema/` devuelve el schema YAML/JSON, `GET /api/docs/` devuelve la UI de Swagger, `POST /api/v1/auth/token/` responde (400 si no hay credenciales, no 404).

---

## Criterios de aceptación globales del Phase 1

Al completar las 7 tareas anteriores, el proyecto debe cumplir todos estos puntos sin excepción:

1. `requirements.txt` lista 10 dependencias incluyendo `djangorestframework-simplejwt`, `django-filter` y `drf-spectacular`.
2. El archivo `.env.example` existe en la raíz del proyecto y documenta `SECRET_KEY`, `DEBUG` y `DATABASE_URL`.
3. `config/settings.py` no contiene ningún valor secreto hardcodeado — ni `SECRET_KEY` ni credenciales de base de datos.
4. `config/settings.py` contiene el bloque `REST_FRAMEWORK` completo con los 6 parámetros especificados en `docs/architecture.md`.
5. `config/settings.py` lista las 4 apps de terceros en `INSTALLED_APPS`.
6. `config/urls.py` registra: `admin/`, `api/v1/auth/` (JWT), `api/v1/` (placeholder), `api/schema/` y `api/docs/`.
7. Con un archivo `.env` válido creado a partir de `.env.example`, el comando `python manage.py check` termina sin errores.
8. Con un archivo `.env` válido, el comando `python manage.py migrate` aplica las migraciones de Django sin errores.
9. El servidor de desarrollo arrancado manualmente responde con schema OpenAPI en `GET /api/schema/` y con Swagger UI en `GET /api/docs/`.
10. `POST /api/v1/auth/token/` con credenciales inválidas responde `400 Bad Request` (no `404 Not Found`), confirmando que la ruta está registrada.

---

## Notas para el implementador

- No crear ni modificar ninguna app de dominio en esta fase. El trabajo queda acotado a `requirements.txt`, `config/settings.py`, `config/urls.py` y `.env.example`.
- El servidor de desarrollo debe iniciarse manualmente por el desarrollador (`python manage.py runserver`). No automatizar el arranque.
- Tras completar TASK-01, ejecutar `pip install -r requirements.txt` para que el entorno virtual tenga las dependencias nuevas antes de continuar con las tareas siguientes.
- `python-decouple` lee `.env` automáticamente desde el directorio de trabajo. El archivo `.env` (no el `.env.example`) debe crearse localmente a partir del ejemplo antes de ejecutar cualquier comando de Django.
