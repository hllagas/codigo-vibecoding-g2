# CLAUDE.md

Este archivo provee orientación a Claude Code (claude.ai/code) para trabajar en este repositorio.

## Lectura obligatoria al iniciar cualquier tarea

> **REGLA**: Leer los dos documentos siguientes **antes de cualquier tarea**, sin excepción. No importa si es un fix pequeño, un nuevo modelo o una nueva app — leer primero, implementar después. No asumir nada sin verificar en estos archivos primero.

| Documento | Cuándo es crítico |
|---|---|
| **[`docs/database-schema.md`](docs/database-schema.md)** | Al crear modelos, migraciones, FKs, restricciones, campos |
| **[`docs/architecture.md`](docs/architecture.md)** | Antes de **cualquier** tarea de desarrollo — define stack, estructura de apps, patrones, orden de implementación, auth y testing |

Toda decisión de implementación debe respetar lo definido en estos documentos. Si hay conflicto entre una instrucción del usuario y estos documentos, señalarlo antes de proceder.

---

## Contexto y alcance del proyecto

**logistica-api** es una API REST para la gestión logística de envíos de productos tecnológicos. Cubre el ciclo completo: desde la recepción de productos de proveedores, su almacenamiento, hasta la entrega al cliente final mediante transportes con rutas asignadas.

### Módulos del sistema

| App Django | Entidad | Responsabilidad |
|---|---|---|
| `customers` | Cliente | Empresa o persona que genera envíos |
| `shipments` | Envío | Unidad central de negocio: origen, destino, estado, fecha de entrega |
| `products` | Producto | Productos de tecnología que serán enviados |
| `transports` | Transporte | Medio de entrega de los productos al cliente |
| `drivers` | Conductor | Persona asignada a un transporte |
| `routes` | Ruta | Secuencia de paradas de un transporte |
| `warehouses` | Almacén | Punto de partida y almacenamiento de productos |
| `suppliers` | Proveedor | Empresas que venden los productos |

**Schema completo**: [`docs/database-schema.md`](docs/database-schema.md)

### Relaciones clave

- Un **envío** (`shipment`) pertenece a un **cliente** y contiene uno o más **productos**
- Un **envío** parte desde un **almacén** y es transportado por un **transporte**
- Un **transporte** tiene un **conductor** asignado y sigue una **ruta**
- Los **productos** en almacén provienen de **proveedores**

---

## Metodología de desarrollo: SDD

> **REGLA**: Todo desarrollo de un módulo sigue el flujo **Spec → Implement → Validator**, coordinado por el agente Orchestrator. No se escribe código sin un spec aprobado primero.

**Agente de entrada para cualquier tarea de desarrollo**: `.claude/agents/orchestrator.md`

```
Orchestrator → Spec (crea spec/<module>.md)
             → Implement (escribe código)
             → Validator (revisa, si hay errores vuelve a Implement)
```

| Agente | Archivo | Escribe código |
|---|---|---|
| Orchestrator | `.claude/agents/orchestrator.md` | No |
| Spec | `.claude/agents/spec.md` | No (solo MD) |
| Implement | `.claude/agents/implement.md` | Sí |
| Validator | `.claude/agents/validator.md` | No |

Alcance completo del MVP: [`docs/mvp-scope.md`](docs/mvp-scope.md)

---

## Skills de Django

Este proyecto usa el plugin `django-skills`. Invocar las siguientes skills para las tareas correspondientes:

| Skill | Cuándo usarla |
|---|---|
| `/fix-types` | Errores de mypy / type checking en Python |
| `/upgrade-python-deps` | Actualizar dependencias de Python |
| `/upgrade-js-deps` | Actualizar dependencias de JavaScript |

> **Nota**: Las skills de `django-skills` asumen el gestor `uv`. Este proyecto usa `pip` + `requirements.txt`. Al ejecutar `/upgrade-python-deps` o `/fix-types`, adaptar los comandos: reemplazar `uv run mypy` por `python -m mypy` y `uv lock`/`uv sync` por `pip install -r requirements.txt`.

## Reglas de ejecución de comandos

- **Entorno virtual**: Siempre activar `.venv` antes de ejecutar cualquier comando dentro del proyecto.
- **Servidor de desarrollo**: `python manage.py runserver` es el único comando que la IA **nunca** debe ejecutar — el usuario lo inicia manualmente. Todos los demás comandos (`test`, `migrate`, `makemigrations`, etc.) pueden ejecutarse normalmente.

## Convenciones de idioma

- **Documentación, comentarios y comunicación**: español
- **Código, nombres de carpetas, archivos, modelos, tablas, columnas, variables, funciones, endpoints**: inglés

Esta regla aplica a todo lo que se cree o modifique en el proyecto.

## Stack

- **Framework**: Django 6.0 + Django REST Framework 3.17
- **Base de datos**: SQLite (desarrollo) / PostgreSQL via `psycopg2-binary` (producción)
- **Configuración**: `python-decouple` para variables de entorno
- **Entorno Python**: `.venv/` (activar antes de ejecutar comandos)

## Comandos

```bash
# Activar entorno virtual (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Levantar servidor de desarrollo — INICIAR MANUALMENTE, la IA nunca debe ejecutar este comando
python manage.py runserver

# Ejecutar todos los tests
python manage.py test

# Ejecutar tests de una app específica
python manage.py test products

# Ejecutar un test case específico
python manage.py test products.tests.ProductModelTest

# Crear y aplicar migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser
```

> **IMPORTANTE**: Antes de cualquier comando, activar el entorno virtual. `python manage.py runserver` es el único comando prohibido para la IA — el usuario lo inicia manualmente.

## Estructura del proyecto

```
logistica-api/
├── config/          # Paquete del proyecto Django (settings, urls, wsgi, asgi)
├── products/        # App Django — models, views, urls, tests, admin
├── manage.py        # CLI de Django
└── requirements.txt
```

`config/` es el módulo de configuración del proyecto (no una app). `ROOT_URLCONF = 'config.urls'` — todos los includes de URLs de apps van en `config/urls.py`.

## Patrón de arquitectura

Capas estándar Django + DRF:

- `products/models.py` — modelos ORM
- `products/serializers.py` — serializadores DRF (crear al agregar endpoints)
- `products/views.py` — `APIView` o `ModelViewSet` de DRF
- `products/urls.py` — URL patterns de la app (incluir desde `config/urls.py`)
- `products/tests.py` — subclases de `TestCase` de Django

## Agregar una nueva app

```bash
python manage.py startapp <appname>
```

Luego registrarla en `config/settings.py` bajo `INSTALLED_APPS`.

## Configuración de DRF

`rest_framework` está instalado pero **aún no está en `INSTALLED_APPS`**. Agregarlo antes de usar DRF:

```python
# config/settings.py
INSTALLED_APPS = [
    ...
    'rest_framework',
    'products',
]
```

## Variables de entorno

`python-decouple` está instalado. Usar `.env` en la raíz del proyecto:

```python
# config/settings.py
from decouple import config
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
```

El `settings.py` actual tiene un `SECRET_KEY` hardcodeado e inseguro — migrar a decouple antes de trabajar con datos reales.
