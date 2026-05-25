# Spec: customers — Phase 2

## Contexto

La app `customers` gestiona los clientes que generan envíos en el sistema. Pueden ser empresas (`company`) o personas naturales (`individual`). El campo `customer_type` es un enum implementado con `TextChoices`. Esta app no tiene FKs hacia otras apps del proyecto; en fases posteriores, `shipments` (Phase 8) referenciará a `customers`.

---

## Dependencias

- **Ninguna dependencia a otras apps del proyecto.** Solo depende del setup base de Phase 1.
- El campo `customer_type` se implementa con `models.TextChoices` de Django — no requiere dependencias adicionales.

---

## Tareas

### TASK-01 — Crear app Django `customers` dentro de `apps/`

Ejecutar desde la raíz del proyecto:

```
python manage.py startapp customers apps/customers
```

Luego actualizar `apps/customers/apps.py` y cambiar el campo `name` a:

```
name = 'apps.customers'
```

Si la carpeta `apps/` no existe aún, crearla con un `__init__.py` vacío.

---

### TASK-02 — Crear modelo `Customer` con enum `CustomerType`

En `apps/customers/models.py`, definir primero la clase `CustomerType` como `TextChoices` con exactamente estos valores (según `database-schema.md`):

| Constante | Valor DB | Label |
|---|---|---|
| `COMPANY` | `'company'` | `'Company'` |
| `INDIVIDUAL` | `'individual'` | `'Individual'` |

Luego definir el modelo `Customer` con exactamente los siguientes campos:

| Campo | Tipo Django | Detalles |
|---|---|---|
| `name` | `CharField` | `max_length=255`, `null=False` |
| `customer_type` | `CharField` | `max_length=20`, `choices=CustomerType.choices`, `null=False` |
| `tax_id` | `CharField` | `max_length=50`, `unique=True`, `null=True`, `blank=True` |
| `email` | `EmailField` | `max_length=254`, `null=False` |
| `phone` | `CharField` | `max_length=20`, `null=True`, `blank=True` |
| `address` | `TextField` | `null=True`, `blank=True` |
| `city` | `CharField` | `max_length=100`, `null=False` |
| `country` | `CharField` | `max_length=100`, `null=False` |
| `is_active` | `BooleanField` | `default=True` |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

La clase `Meta` debe definir:
- `db_table = 'customers'`
- `ordering = ['name']`

---

### TASK-03 — Crear serializer `CustomerSerializer`

En `apps/customers/serializers.py`, definir un `ModelSerializer` para el modelo `Customer`:

- `fields = '__all__'`
- `read_only_fields = ['id', 'created_at', 'updated_at']`

No requiere serialización anidada ni sobrescritura de métodos. DRF generará automáticamente validación para `customer_type` basada en `choices`.

---

### TASK-04 — Crear ViewSet `CustomerViewSet`

En `apps/customers/views.py`, definir un `ModelViewSet`:

- `queryset`: todos los objetos `Customer`
- `serializer_class`: `CustomerSerializer`
- `filterset_fields`: `['customer_type', 'city', 'country', 'is_active']`
- `search_fields`: `['name', 'email', 'tax_id']`
- `ordering_fields`: `['name', 'customer_type', 'created_at']`

No se definen acciones personalizadas en esta app.

---

### TASK-05 — Crear `apps/customers/urls.py` con `DefaultRouter`

En `apps/customers/urls.py`:

- Instanciar `DefaultRouter`
- Registrar `CustomerViewSet` bajo el prefijo `'customers'`
- Exponer `urlpatterns = router.urls`

Los endpoints generados automáticamente serán:
- `GET /api/v1/customers/` — listar
- `POST /api/v1/customers/` — crear
- `GET /api/v1/customers/{id}/` — detalle
- `PUT /api/v1/customers/{id}/` — actualización completa
- `PATCH /api/v1/customers/{id}/` — actualización parcial
- `DELETE /api/v1/customers/{id}/` — eliminar

---

### TASK-06 — Registrar en `INSTALLED_APPS`

En `config/settings.py`, agregar `'apps.customers'` a la lista `INSTALLED_APPS`.

---

### TASK-07 — Incluir URLs en `config/urls.py`

En `config/urls.py`, dentro del bloque `api/v1/`, agregar:

```
path('', include('apps.customers.urls')),
```

La ruta final será `http://localhost:8000/api/v1/customers/`.

---

### TASK-08 — Crear migración y aplicarla

Ejecutar:

```
python manage.py makemigrations customers
python manage.py migrate
```

Verificar que la tabla `customers` se crea correctamente con todas las columnas, incluyendo el campo `customer_type` como `varchar`.

---

### TASK-09 — Escribir tests

En `customers/tests/`:

- Crear `__init__.py` vacío
- `test_models.py`: verificar que un `Customer` se crea con los campos requeridos, que `is_active` es `True` por defecto, que `customer_type` acepta solo `'company'` e `'individual'`, y que `tax_id` admite valores nulos y únicos.
- `test_views.py`: usar `APITestCase`. Cubrir:
  - `POST /api/v1/customers/` — creación exitosa con `customer_type='company'` (201)
  - `POST /api/v1/customers/` — creación exitosa con `customer_type='individual'` (201)
  - `POST /api/v1/customers/` — `customer_type` inválido retorna 400
  - `POST /api/v1/customers/` — datos inválidos (400, ej: `email` ausente)
  - `GET /api/v1/customers/` — listado (200)
  - `GET /api/v1/customers/?customer_type=company` — filtrado por tipo (200)
  - `GET /api/v1/customers/{id}/` — detalle (200)
  - `GET /api/v1/customers/{id}/` — no encontrado (404)
  - `PUT /api/v1/customers/{id}/` — actualización completa (200)
  - `PATCH /api/v1/customers/{id}/` — actualización parcial (200)
  - `DELETE /api/v1/customers/{id}/` — eliminación (204)
  - Request sin autenticación (401)

---

## Criterios de aceptación

1. `python manage.py makemigrations customers` genera una migración sin errores.
2. `python manage.py migrate` crea la tabla `customers` con todas las columnas del schema.
3. `GET /api/v1/customers/` retorna 200 con lista paginada cuando el usuario está autenticado.
4. `GET /api/v1/customers/` retorna 401 sin token JWT.
5. `POST /api/v1/customers/` con `name`, `customer_type='company'`, `email`, `city`, `country` retorna 201.
6. `POST /api/v1/customers/` con `customer_type='corporation'` (valor inválido) retorna 400.
7. `POST /api/v1/customers/` sin `customer_type` retorna 400.
8. Dos customers con el mismo `tax_id` generan error 400 (unique constraint).
9. `?customer_type=individual` filtra y retorna solo clientes de tipo individual.
10. `?search=acme` filtra por `name`, `email` o `tax_id`.
11. `?is_active=false` incluye clientes inactivos en el listado.
12. El campo `customer_type` en la respuesta JSON contiene el valor string (`'company'` o `'individual'`), no el label ni un entero.
13. `python manage.py test customers` ejecuta todos los tests sin fallos.
14. `GET /api/docs/` refleja los endpoints de `customers` y los valores válidos del enum `customer_type` en la documentación OpenAPI.
