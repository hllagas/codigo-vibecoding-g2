# Schema de base de datos — logistica-api

## Tablas nativas de Django

Django genera automáticamente las siguientes tablas. No se crean manualmente.

| Tabla | Uso en este proyecto |
|---|---|
| `auth_user` | Base para el modelo `drivers` (relación OneToOne). También cubre administradores del sistema |
| `auth_group` / `auth_permission` | Control de acceso por rol |
| `django_session`, `django_content_type`, `django_admin_log`, `django_migrations` | Uso interno de Django |

---

## Tablas del proyecto

### `suppliers` — Proveedores

Empresas que venden los productos tecnológicos al sistema.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `name` | varchar(255) | NOT NULL | Nombre de la empresa |
| `tax_id` | varchar(50) | UNIQUE, nullable | RUC / NIT / identificador fiscal |
| `email` | varchar(254) | NOT NULL | |
| `phone` | varchar(20) | nullable | |
| `address` | text | nullable | Dirección física |
| `city` | varchar(100) | NOT NULL | |
| `country` | varchar(100) | NOT NULL | |
| `is_active` | boolean | DEFAULT true | |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

---

### `warehouses` — Almacenes

Puntos de almacenamiento y despacho de productos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `name` | varchar(255) | NOT NULL | Nombre del almacén |
| `address` | text | NOT NULL | |
| `city` | varchar(100) | NOT NULL | |
| `country` | varchar(100) | NOT NULL | |
| `latitude` | decimal(9,6) | nullable | Coordenada geográfica |
| `longitude` | decimal(9,6) | nullable | Coordenada geográfica |
| `capacity` | integer | NOT NULL | Capacidad máxima en unidades |
| `is_active` | boolean | DEFAULT true | |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

---

### `customers` — Clientes

Empresas o personas que generan envíos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `name` | varchar(255) | NOT NULL | Nombre o razón social |
| `customer_type` | enum | NOT NULL | `'company'` o `'individual'` |
| `tax_id` | varchar(50) | UNIQUE, nullable | RUC / NIT / identificador fiscal |
| `email` | varchar(254) | NOT NULL | |
| `phone` | varchar(20) | nullable | |
| `address` | text | nullable | |
| `city` | varchar(100) | NOT NULL | |
| `country` | varchar(100) | NOT NULL | |
| `is_active` | boolean | DEFAULT true | |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

---

### `products` — Productos

Artículos de tecnología gestionados en el sistema.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `name` | varchar(255) | NOT NULL | |
| `description` | text | nullable | |
| `sku` | varchar(100) | UNIQUE, NOT NULL | Código interno de inventario |
| `category` | varchar(100) | NOT NULL | Ej: laptop, smartphone, tablet |
| `unit_price` | decimal(10,2) | NOT NULL | Precio unitario actual |
| `weight_kg` | decimal(6,3) | NOT NULL | Peso en kilogramos |
| `supplier_id` | integer | FK → suppliers | Proveedor del producto |
| `is_active` | boolean | DEFAULT true | |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

---

### `warehouse_stock` — Stock por almacén

Relación M2M entre almacenes y productos con cantidad disponible.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `warehouse_id` | integer | FK → warehouses | |
| `product_id` | integer | FK → products | |
| `quantity` | integer | NOT NULL, DEFAULT 0 | Unidades disponibles |
| `updated_at` | datetime | auto | |

**Restricción única**: (`warehouse_id`, `product_id`)

---

### `drivers` — Conductores

Extiende `auth_user` con datos específicos del conductor.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `user_id` | integer | FK → auth_user, OneToOne | Cuenta de acceso al sistema |
| `license_number` | varchar(50) | UNIQUE, NOT NULL | Número de licencia de conducir |
| `license_expiry` | date | NOT NULL | Fecha de vencimiento de la licencia |
| `phone` | varchar(20) | NOT NULL | Teléfono de contacto |
| `is_available` | boolean | DEFAULT true | Disponible para ser asignado |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

---

### `transports` — Transportes

Vehículos disponibles para realizar envíos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `name` | varchar(255) | NOT NULL | Identificador o alias del vehículo |
| `plate_number` | varchar(20) | UNIQUE, NOT NULL | Placa del vehículo |
| `transport_type` | enum | NOT NULL | `'truck'`, `'van'`, `'motorcycle'`, `'bicycle'` |
| `capacity_kg` | decimal(8,2) | NOT NULL | Capacidad máxima de carga en kg |
| `driver_id` | integer | FK → drivers, nullable | Conductor actualmente asignado |
| `is_active` | boolean | DEFAULT true | |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

---

### `routes` — Rutas

Trayecto de un transporte desde un almacén origen hasta sus destinos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `name` | varchar(255) | NOT NULL | Nombre descriptivo de la ruta |
| `origin_warehouse_id` | integer | FK → warehouses | Almacén de salida |
| `transport_id` | integer | FK → transports | Vehículo asignado |
| `status` | enum | DEFAULT `'planned'` | `'planned'`, `'in_progress'`, `'completed'`, `'cancelled'` |
| `estimated_duration_hours` | decimal(5,2) | nullable | Duración estimada en horas |
| `started_at` | datetime | nullable | Hora real de inicio |
| `completed_at` | datetime | nullable | Hora real de finalización |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

---

### `route_stops` — Paradas de ruta

Secuencia ordenada de paradas dentro de una ruta.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `route_id` | integer | FK → routes | |
| `stop_order` | integer | NOT NULL | Posición en la secuencia (1, 2, 3...) |
| `address` | text | NOT NULL | Dirección de la parada |
| `city` | varchar(100) | NOT NULL | |
| `latitude` | decimal(9,6) | nullable | |
| `longitude` | decimal(9,6) | nullable | |
| `estimated_arrival` | datetime | nullable | Llegada estimada |
| `actual_arrival` | datetime | nullable | Llegada real |

**Restricción única**: (`route_id`, `stop_order`)

---

### `shipments` — Envíos

Unidad central de negocio. Representa un pedido de un cliente desde un almacén hasta su destino.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `tracking_number` | varchar(50) | UNIQUE, NOT NULL | Código de seguimiento público |
| `customer_id` | integer | FK → customers | Cliente que genera el envío |
| `origin_warehouse_id` | integer | FK → warehouses | Almacén de despacho |
| `route_id` | integer | FK → routes, nullable | Se asigna al despachar el envío |
| `destination_address` | text | NOT NULL | |
| `destination_city` | varchar(100) | NOT NULL | |
| `destination_country` | varchar(100) | NOT NULL | |
| `status` | enum | DEFAULT `'pending'` | `'pending'`, `'processing'`, `'in_transit'`, `'delivered'`, `'cancelled'`, `'returned'` |
| `scheduled_delivery_date` | date | NOT NULL | Fecha prometida de entrega |
| `actual_delivery_date` | date | nullable | Fecha real de entrega |
| `total_weight_kg` | decimal(8,2) | NOT NULL | Peso total del envío |
| `notes` | text | nullable | Observaciones adicionales |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

---

### `shipment_items` — Ítems del envío

Productos incluidos en un envío con la cantidad y el precio vigente al momento del despacho.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | integer | PK, auto | |
| `shipment_id` | integer | FK → shipments | |
| `product_id` | integer | FK → products | |
| `quantity` | integer | NOT NULL | Cantidad de unidades |
| `unit_price_at_shipment` | decimal(10,2) | NOT NULL | Precio capturado al crear el envío |

**Restricción única**: (`shipment_id`, `product_id`)

> `unit_price_at_shipment` se guarda por separado para que cambios futuros en `products.unit_price` no alteren el historial de envíos.

---

## Diagrama de relaciones

```
auth_user ──(1:1)── drivers
                       │
                    (1:N)
                       │
                   transports
                       │
                    (1:N)
                       │
                     routes ──(1:N)── route_stops
                       │
                    (1:N)
                       │
                  shipments ──(N:1)── customers
                       │
                       ├──(N:1)── warehouses ──(1:N)── warehouse_stock ──(N:1)── products
                       │                                                               │
                    (1:N)                                                           (N:1)
                       │                                                            suppliers
                 shipment_items
                       │
                    (N:1)
                       │
                    products
```

---

## Resumen de relaciones

| Tabla A | Relación | Tabla B | Campo FK |
|---|---|---|---|
| `drivers` | OneToOne | `auth_user` | `drivers.user_id` |
| `transports` | ManyToOne | `drivers` | `transports.driver_id` |
| `routes` | ManyToOne | `transports` | `routes.transport_id` |
| `routes` | ManyToOne | `warehouses` | `routes.origin_warehouse_id` |
| `route_stops` | ManyToOne | `routes` | `route_stops.route_id` |
| `shipments` | ManyToOne | `customers` | `shipments.customer_id` |
| `shipments` | ManyToOne | `warehouses` | `shipments.origin_warehouse_id` |
| `shipments` | ManyToOne | `routes` | `shipments.route_id` |
| `shipment_items` | ManyToOne | `shipments` | `shipment_items.shipment_id` |
| `shipment_items` | ManyToOne | `products` | `shipment_items.product_id` |
| `products` | ManyToOne | `suppliers` | `products.supplier_id` |
| `warehouse_stock` | ManyToOne | `warehouses` | `warehouse_stock.warehouse_id` |
| `warehouse_stock` | ManyToOne | `products` | `warehouse_stock.product_id` |
