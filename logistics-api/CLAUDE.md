# CLAUDE.md

Este archivo provee instrucciones a Claude Code (claude.ai/code) para trabajar en este repositorio.

## Skills

- **code-review** (plugin `code-review@claude-plugins-official`) está instalado en este proyecto. Usar siempre sus skills disponibles al trabajar con modelos, vistas, serializers, migraciones, tests o cualquier tarea Django/DRF.

## Reglas del proyecto

- **Documentación y comunicación**: siempre en español — comentarios, mensajes de commit, respuestas, este archivo.
- **Código y estructura**: siempre en inglés — nombres de variables, funciones, clases, archivos, carpetas, tablas, columnas, endpoints, ramas de git.
- **Entorno virtual**: antes de ejecutar cualquier comando dentro del proyecto, activar el entorno virtual (`.venv\Scripts\activate` en Windows, `source .venv/bin/activate` en Unix).
- **Servidor de desarrollo**: `python manage.py runserver` es el único comando que la IA **nunca** ejecuta — siempre lo inicia el usuario manualmente. Todos los demás comandos (`migrate`, `makemigrations`, `test`, `startapp`, etc.) la IA puede ejecutarlos.
- **Schema de base de datos**: leer siempre `docs/database-schema.md` antes de trabajar en cualquier modelo, serializer, vista o migración — es la fuente de verdad del diseño de datos.
- **Arquitectura**: leer siempre `docs/architecture.md` antes de cualquier tarea de desarrollo — define capas, patrones, convenciones de respuesta y orden de implementación obligatorio.

## Comandos

```bash
# Setup
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # Unix
pip install -r requirements.txt

# Base de datos
python manage.py makemigrations
python manage.py migrate

# Servidor de desarrollo — iniciar manualmente, nunca mediante la IA
python manage.py runserver      # http://localhost:8000

# Tests
python manage.py test                        # todos los tests
python manage.py test products               # una app específica
python manage.py test products.tests.TestFoo # una clase de test específica
```

## Documentación

- [Esquema de base de datos](docs/database-schema.md) — tablas, columnas, tipos y relaciones
- [Arquitectura de desarrollo](docs/architecture.md) — capas, patrones, endpoints, orden de desarrollo

## Contexto del proyecto

API REST de logística para gestión de envíos de productos tecnológicos: desde el almacén hasta el cliente final, pasando por transporte, conductores y rutas.

## Alcance — Módulos

| App Django | Dominio | Responsabilidad |
|---|---|---|
| `customers` | Cliente | Empresa o persona que genera envíos |
| `shipments` | Envío | Unidad central de negocio: origen, destino, estado, fecha de entrega, costo calculado |
| `products` | Producto | Productos tecnológicos que serán enviados |
| `transports` | Transporte | Medio de entrega de los productos |
| `drivers` | Conductor | Persona asignada a un transporte |
| `routes` | Ruta | Secuencia de paradas del transporte |
| `warehouses` | Almacén | Punto de partida y almacenamiento de productos |
| `suppliers` | Proveedor | Empresas que venden los productos |

## Arquitectura

Django 6 + Django REST Framework 3.17. La configuración del proyecto vive en `config/` (no es una app de Django). Cada módulo es una app Django independiente en su propio directorio de nivel superior.

**Patrón**: URL → ViewSet → Serializer → Model. Usar `ModelViewSet` de DRF cuando el CRUD es estándar; `APIView` solo para lógica personalizada.

**Árbol propuesto del proyecto:**

```
logistics-api/
├── manage.py
├── requirements.txt
├── .env                          ← variables de entorno (no commitear)
├── config/
│   ├── settings.py
│   ├── urls.py                   ← incluye urls de cada app
│   ├── wsgi.py
│   └── asgi.py
└── apps/
    ├── customers/
    │   ├── apps.py
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── urls.py
    │   └── tests.py
    ├── shipments/
    │   ├── apps.py
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── urls.py
    │   └── tests.py
    ├── products/
    │   ├── apps.py
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── urls.py
    │   └── tests.py
    ├── transports/
    │   ├── apps.py
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── urls.py
    │   └── tests.py
    ├── drivers/
    │   ├── apps.py
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── urls.py
    │   └── tests.py
    ├── routes/
    │   ├── apps.py
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── urls.py
    │   └── tests.py
    ├── warehouses/
    │   ├── apps.py
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── urls.py
    │   └── tests.py
    └── suppliers/
        ├── apps.py
        ├── models.py
        ├── serializers.py
        ├── views.py
        ├── urls.py
        └── tests.py
```

> **Nota**: al usar `apps/`, el `name` en cada `apps.py` debe ser `'apps.<nombre>'` (ej. `'apps.customers'`) y así registrarse en `INSTALLED_APPS`.

## Estado actual

- `products/` existe pero **no está registrada en `INSTALLED_APPS`** y no tiene modelos, vistas ni URLs — es un scaffold vacío.
- DRF está instalado pero no configurado en `settings.py` — agregar `'rest_framework'` a `INSTALLED_APPS` y registrar la app `products` antes de usar cualquiera de los dos.
- Base de datos: SQLite3 en desarrollo (`db.sqlite3`). `psycopg2-binary` está instalado para migración futura a PostgreSQL.
- `SECRET_KEY` está hardcodeado en `settings.py` — mover a `.env` + `python-decouple` (ya está en requirements) antes de cualquier uso en producción.

## Agregar una nueva app

1. `python manage.py startapp <name>`
2. Agregar `'<name>'` a `INSTALLED_APPS` en `config/settings.py`
3. Crear `<name>/urls.py`, incluirlo en `config/urls.py`
4. Definir modelos → `makemigrations` → `migrate`
