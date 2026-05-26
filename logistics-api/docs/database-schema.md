# Esquema de base de datos — Logistics API

Django nombra las tablas automáticamente como `<app>_<model>`. Todas las tablas incluyen una columna `id` (PK autoincremental) generada por Django salvo indicación contraria.

---

## Tablas de Django (built-in)

Se usan sin modificación. Los modelos del proyecto referencian `auth_user` mediante `OneToOneField` para no duplicar datos de autenticación.

| Tabla | Uso en este proyecto |
|---|---|
| `auth_user` | Credenciales de clientes y conductores |
| `auth_group` | Grupos de permisos (admin, operador, etc.) |
| `auth_permission` | Permisos granulares por modelo |
| `django_admin_log` | Auditoría de acciones en el admin |
| `django_content_type` | Base para el sistema de permisos |
| `django_session` | Sesiones de usuario |

---

## Tablas del proyecto

### `customers_customer`
Empresa o persona que genera envíos. Extiende `auth_user` para login.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK | — |
| `user_id` | integer | FK → `auth_user`, unique | Credenciales de acceso |
| `company_name` | varchar(200) | nullable | Nombre de empresa (si aplica) |
| `tax_id` | varchar(20) | unique, nullable | RUC / DNI / NIT |
| `phone` | varchar(20) | — | Teléfono de contacto |
| `address` | text | — | Dirección principal |
| `city` | varchar(100) | — | Ciudad |
| `country` | varchar(100) | — | País |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

---

### `suppliers_supplier`
Empresas que venden los productos tecnológicos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK | — |
| `name` | varchar(200) | — | Razón social |
| `tax_id` | varchar(20) | unique | RUC / NIT |
| `contact_name` | varchar(200) | — | Persona de contacto |
| `email` | varchar(254) | — | Correo |
| `phone` | varchar(20) | — | Teléfono |
| `address` | text | — | Dirección |
| `city` | varchar(100) | — | Ciudad |
| `country` | varchar(100) | — | País |
| `is_active` | boolean | default=True | Estado |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

---

### `warehouses_warehouse`
Punto de partida y almacenamiento de productos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK | — |
| `name` | varchar(200) | — | Nombre del almacén |
| `code` | varchar(20) | unique | Código interno |
| `address` | text | — | Dirección física |
| `city` | varchar(100) | — | Ciudad |
| `state` | varchar(100) | — | Departamento / Estado |
| `country` | varchar(100) | — | País |
| `latitude` | decimal(9,6) | nullable | Coordenada GPS |
| `longitude` | decimal(9,6) | nullable | Coordenada GPS |
| `capacity_m3` | decimal(10,2) | — | Capacidad total en m³ |
| `is_active` | boolean | default=True | Estado |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

---

### `products_product`
Productos tecnológicos disponibles para envío.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK | — |
| `supplier_id` | integer | FK → `suppliers_supplier` | Proveedor del producto |
| `warehouse_id` | integer | FK → `warehouses_warehouse` | Almacén donde está almacenado |
| `name` | varchar(200) | — | Nombre del producto |
| `sku` | varchar(50) | unique | Código de producto |
| `description` | text | nullable | Descripción |
| `unit_price` | decimal(10,2) | — | Precio unitario |
| `weight_kg` | decimal(8,3) | — | Peso en kilogramos |
| `length_cm` | decimal(8,2) | nullable | Largo |
| `width_cm` | decimal(8,2) | nullable | Ancho |
| `height_cm` | decimal(8,2) | nullable | Alto |
| `stock` | integer | ≥ 0 | Unidades disponibles |
| `is_active` | boolean | default=True | Estado |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

---

### `transports_transport`
Vehículo utilizado para entregar los productos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK | — |
| `license_plate` | varchar(20) | unique | Placa |
| `type` | varchar(20) | choices | `TRUCK` / `VAN` / `MOTORCYCLE` / `BIKE` |
| `brand` | varchar(100) | — | Marca |
| `model` | varchar(100) | — | Modelo |
| `year` | smallint | — | Año de fabricación |
| `capacity_kg` | decimal(8,2) | — | Capacidad de carga en kg |
| `capacity_m3` | decimal(8,2) | — | Capacidad volumétrica en m³ |
| `status` | varchar(20) | choices | `AVAILABLE` / `IN_ROUTE` / `MAINTENANCE` / `INACTIVE` |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

---

### `drivers_driver`
Conductor asignado a un transporte. Extiende `auth_user`.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK | — |
| `user_id` | integer | FK → `auth_user`, unique | Credenciales de acceso |
| `license_number` | varchar(50) | unique | Número de licencia de conducir |
| `license_type` | varchar(10) | choices | `A` / `B` / `C` |
| `phone` | varchar(20) | — | Teléfono móvil |
| `status` | varchar(20) | choices | `AVAILABLE` / `ON_ROUTE` / `OFF_DUTY` |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

---

### `routes_route`
Ruta definida con almacén de origen y secuencia de paradas.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK | — |
| `name` | varchar(200) | — | Nombre descriptivo |
| `origin_warehouse_id` | integer | FK → `warehouses_warehouse` | Almacén de partida |
| `estimated_duration_hours` | decimal(5,2) | — | Duración estimada |
| `is_active` | boolean | default=True | Estado |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

---

### `routes_routestop`
Paradas ordenadas dentro de una ruta.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK | — |
| `route_id` | integer | FK → `routes_route` | Ruta padre |
| `order` | smallint | — | Posición en la secuencia |
| `address` | text | — | Dirección de la parada |
| `city` | varchar(100) | — | Ciudad |
| `latitude` | decimal(9,6) | nullable | Coordenada GPS |
| `longitude` | decimal(9,6) | nullable | Coordenada GPS |

---

### `shipments_shipment`
Unidad central de negocio. Registra el envío completo desde origen hasta entrega.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK | — |
| `tracking_number` | varchar(50) | unique | Código de seguimiento |
| `customer_id` | integer | FK → `customers_customer` | Cliente que genera el envío |
| `origin_warehouse_id` | integer | FK → `warehouses_warehouse` | Almacén de despacho |
| `transport_id` | integer | FK → `transports_transport`, nullable | Vehículo asignado |
| `driver_id` | integer | FK → `drivers_driver`, nullable | Conductor asignado |
| `route_id` | integer | FK → `routes_route`, nullable | Ruta asignada |
| `destination_address` | text | — | Dirección de entrega |
| `destination_city` | varchar(100) | — | Ciudad de entrega |
| `destination_country` | varchar(100) | — | País de entrega |
| `status` | varchar(20) | choices | Ver estados abajo |
| `scheduled_date` | date | — | Fecha programada de entrega |
| `delivered_at` | datetime | nullable | Fecha y hora real de entrega |
| `total_weight_kg` | decimal(8,3) | — | Peso total calculado |
| `base_cost` | decimal(10,2) | — | Costo base del envío |
| `calculated_cost` | decimal(10,2) | — | Costo final con recargos |
| `notes` | text | nullable | Observaciones |
| `created_at` | datetime | auto | — |
| `updated_at` | datetime | auto | — |

**Estados del envío (`status`):**

| Valor | Descripción |
|---|---|
| `PENDING` | Pendiente de asignación |
| `PICKED_UP` | Recogido en almacén |
| `IN_TRANSIT` | En tránsito |
| `DELIVERED` | Entregado |
| `CANCELLED` | Cancelado |
| `RETURNED` | Devuelto al almacén |

---

### `shipments_shipmentproduct`
Tabla intermedia: productos incluidos en un envío (relación M2M con datos extra).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK | — |
| `shipment_id` | integer | FK → `shipments_shipment` | Envío |
| `product_id` | integer | FK → `products_product` | Producto |
| `quantity` | integer | ≥ 1 | Unidades enviadas |
| `unit_price` | decimal(10,2) | — | Precio al momento del envío (snapshot) |

---

## Relaciones entre tablas

```
auth_user ──────────────┬── customers_customer (1:1)
                        └── drivers_driver (1:1)

suppliers_supplier ─────── products_product (1:N)

warehouses_warehouse ───┬── products_product (1:N)
                        ├── routes_route (1:N)  ← origen
                        └── shipments_shipment (1:N)  ← origen

routes_route ───────────── routes_routestop (1:N)

customers_customer ─────── shipments_shipment (1:N)
transports_transport ───── shipments_shipment (1:N)
drivers_driver ─────────── shipments_shipment (1:N)
routes_route ───────────── shipments_shipment (1:N)

shipments_shipment ─────── shipments_shipmentproduct (1:N)
products_product ───────── shipments_shipmentproduct (1:N)
```
