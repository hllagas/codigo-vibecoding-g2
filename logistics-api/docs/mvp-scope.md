# MVP Scope — Logistics API

## Objetivo

API REST de logística para gestión de envíos de productos tecnológicos. Desplegada en Railway. Metodología: **SDD (Spec Driven Development)**.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Django 6 + Django REST Framework 3.17 |
| Autenticación | DRF Token Authentication + JWT (djangorestframework-simplejwt) |
| Base de datos | SQLite (desarrollo) / PostgreSQL (Railway producción) |
| Variables de entorno | python-decouple |
| Despliegue | Railway |

---

## Autenticación

Django auth built-in combinado con JWT vía `djangorestframework-simplejwt`.

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/v1/auth/register/` | POST | Registro de usuario |
| `/api/v1/auth/login/` | POST | Obtener access + refresh token |
| `/api/v1/auth/refresh/` | POST | Renovar access token |
| `/api/v1/auth/logout/` | POST | Invalidar token |

Todas las rutas de negocio requieren:
```
Authorization: Bearer <access_token>
```

Roles vía `auth_group`:

| Grupo | Acceso |
|---|---|
| `admin` | CRUD completo en todos los módulos |
| `operator` | CRUD en shipments, lectura en el resto |
| `driver` | Lectura de sus envíos asignados, actualización de estado |
| `customer` | CRUD en sus propios envíos |

---

## Módulos — Alcance CRUD

Cada módulo es una app Django independiente. Todos exponen CRUD completo vía `ModelViewSet`.

| App | Endpoint base | Operaciones |
|---|---|---|
| `customers` | `/api/v1/customers/` | GET list, GET detail, POST, PUT, PATCH, DELETE |
| `suppliers` | `/api/v1/suppliers/` | GET list, GET detail, POST, PUT, PATCH, DELETE |
| `warehouses` | `/api/v1/warehouses/` | GET list, GET detail, POST, PUT, PATCH, DELETE |
| `products` | `/api/v1/products/` | GET list, GET detail, POST, PUT, PATCH, DELETE |
| `transports` | `/api/v1/transports/` | GET list, GET detail, POST, PUT, PATCH, DELETE |
| `drivers` | `/api/v1/drivers/` | GET list, GET detail, POST, PUT, PATCH, DELETE |
| `routes` | `/api/v1/routes/` | GET list, GET detail, POST, PUT, PATCH, DELETE |
| `shipments` | `/api/v1/shipments/` | GET list, GET detail, POST, PUT, PATCH, DELETE |
| `shipments` | `/api/v1/shipments/{id}/update-status/` | POST (acción custom) |

---

## Lógica de negocio incluida en MVP

- Cálculo automático de costo de envío (`base_cost`, `calculated_cost`)
- Generación automática de `tracking_number`
- Descuento de stock al crear envío
- Validación de transiciones de estado del envío
- Asignación de transporte y conductor con validación de disponibilidad
- Actualización de `delivered_at` al cambiar estado a `DELIVERED`

### Transiciones de estado válidas

```
PENDING → PICKED_UP → IN_TRANSIT → DELIVERED
PENDING → CANCELLED
IN_TRANSIT → RETURNED
```

---

## Fases de desarrollo

El orden respeta las FK del schema para no bloquear migraciones. Cada fase sigue el flujo SDD: **Spec → Implement → Validate**.

---

### Fase 1 — Configuración base
**Dependencias**: ninguna

Tareas:
- Mover `SECRET_KEY` a `.env` + `python-decouple`
- Configurar `config/settings.py`: `INSTALLED_APPS`, `REST_FRAMEWORK`, `DATABASES`
- Instalar y registrar `rest_framework`, `rest_framework.authtoken`, `djangorestframework-simplejwt`
- Crear `config/urls.py` con prefijo `/api/v1/`
- Configurar endpoints JWT: `login/`, `refresh/`, `logout/`
- Crear grupos de permisos: `admin`, `operator`, `driver`, `customer`
- Ejecutar migraciones iniciales

---

### Fase 2 — `warehouses`
**Dependencias**: Fase 1

Tablas: `warehouses_warehouse`

Tareas:
- `models.py` — `Warehouse` con todos los campos del schema
- `serializers.py` — `WarehouseSerializer`
- `services.py` — sin lógica de negocio compleja en MVP
- `views.py` — `WarehouseViewSet` (ModelViewSet)
- `urls.py` → registrado en `config/urls.py` como `/api/v1/warehouses/`
- Migración aplicada

---

### Fase 3 — `suppliers`
**Dependencias**: Fase 1

Tablas: `suppliers_supplier`

Tareas:
- `models.py` — `Supplier` con todos los campos del schema
- `serializers.py` — `SupplierSerializer`
- `services.py` — sin lógica de negocio compleja en MVP
- `views.py` — `SupplierViewSet` (ModelViewSet)
- `urls.py` → registrado en `config/urls.py` como `/api/v1/suppliers/`
- Migración aplicada

---

### Fase 4 — `customers`
**Dependencias**: Fase 1 (`auth_user`)

Tablas: `customers_customer`

Tareas:
- `models.py` — `Customer` con `OneToOneField → auth_user` + campos del schema
- `serializers.py` — `CustomerSerializer` (incluye campos de `auth_user` para registro)
- `services.py` — `create_customer(data)`: crea `auth_user` + `Customer`, asigna grupo `customer`
- `views.py` — `CustomerViewSet` + endpoint de registro público (`AllowAny`)
- `urls.py` → registrado en `config/urls.py` como `/api/v1/customers/`
- Migración aplicada

---

### Fase 5 — `drivers`
**Dependencias**: Fase 1 (`auth_user`)

Tablas: `drivers_driver`

Tareas:
- `models.py` — `Driver` con `OneToOneField → auth_user` + campos del schema + choices `license_type`, `status`
- `serializers.py` — `DriverSerializer`
- `services.py` — `create_driver(data)`: crea `auth_user` + `Driver`, asigna grupo `driver`
- `views.py` — `DriverViewSet` (ModelViewSet)
- `urls.py` → registrado en `config/urls.py` como `/api/v1/drivers/`
- Migración aplicada

---

### Fase 6 — `transports`
**Dependencias**: Fase 1

Tablas: `transports_transport`

Tareas:
- `models.py` — `Transport` con choices `type` (`TRUCK/VAN/MOTORCYCLE/BIKE`) y `status` (`AVAILABLE/IN_ROUTE/MAINTENANCE/INACTIVE`)
- `serializers.py` — `TransportSerializer`
- `services.py` — sin lógica de negocio compleja en MVP
- `views.py` — `TransportViewSet` (ModelViewSet)
- `urls.py` → registrado en `config/urls.py` como `/api/v1/transports/`
- Migración aplicada

---

### Fase 7 — `products`
**Dependencias**: Fase 2 (`warehouses`), Fase 3 (`suppliers`)

Tablas: `products_product`

Tareas:
- `models.py` — `Product` con FK → `Supplier`, FK → `Warehouse` + campos del schema
- `serializers.py` — `ProductSerializer`
- `services.py` — `update_stock(product, quantity, operation)`: incrementa/decrementa con validación stock ≥ 0
- `views.py` — `ProductViewSet` (ModelViewSet)
- `urls.py` → registrado en `config/urls.py` como `/api/v1/products/`
- Migración aplicada

---

### Fase 8 — `routes`
**Dependencias**: Fase 2 (`warehouses`)

Tablas: `routes_route`, `routes_routestop`

Tareas:
- `models.py` — `Route` con FK → `Warehouse` (origen) + `RouteStop` con FK → `Route` y campo `order`
- `serializers.py` — `RouteStopSerializer`, `RouteSerializer` (con stops anidados, read-only)
- `services.py` — sin lógica de negocio compleja en MVP
- `views.py` — `RouteViewSet` (ModelViewSet), `RouteStopViewSet`
- `urls.py` → registrado en `config/urls.py` como `/api/v1/routes/`
- Migración aplicada

---

### Fase 9 — `shipments`
**Dependencias**: Fases 2–8 (todos los módulos anteriores)

Tablas: `shipments_shipment`, `shipments_shipmentproduct`

Tareas:
- `models.py` — `Shipment` con todas las FK nullable/requeridas + choices `status` + `ShipmentProduct` (tabla intermedia)
- `serializers.py` — `ShipmentProductSerializer`, `ShipmentSerializer` (con productos anidados)
- `services.py`:
  - `create_shipment(data)` — genera `tracking_number`, descuenta stock, calcula costo
  - `calculate_shipment_cost(shipment)` — costo base por peso + recargo por tipo transporte
  - `assign_transport(shipment, transport, driver)` — valida disponibilidad, actualiza estados
  - `update_shipment_status(shipment, new_status)` — valida transición, actualiza `delivered_at`
- `views.py` — `ShipmentViewSet` + acción custom `update_status` (`@action POST`)
- `urls.py` → registrado en `config/urls.py` como `/api/v1/shipments/`
- Migración aplicada

---

### Resumen de fases

| Fase | App | Dependencias de FK |
|---|---|---|
| 1 | `config` | — |
| 2 | `warehouses` | — |
| 3 | `suppliers` | — |
| 4 | `customers` | `auth_user` |
| 5 | `drivers` | `auth_user` |
| 6 | `transports` | — |
| 7 | `products` | `warehouses`, `suppliers` |
| 8 | `routes` | `warehouses` |
| 9 | `shipments` | todos los anteriores |

---

## Despliegue en Railway

- Variables de entorno configuradas en Railway dashboard
- `DATABASE_URL` provista por Railway PostgreSQL plugin
- `Procfile` o `railway.toml` con comando: `python manage.py migrate && gunicorn config.wsgi`
- `requirements.txt` incluye `gunicorn`, `psycopg2-binary`
- `ALLOWED_HOSTS` incluye dominio Railway

---

## Fuera del MVP

- WebSockets / notificaciones en tiempo real
- Panel de administración personalizado
- Reportes y dashboards
- Integración con sistemas de pago
- Tracking GPS en tiempo real
- Mobile app
