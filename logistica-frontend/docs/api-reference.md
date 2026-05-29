# API Reference — logistica-api

**Base URL**: `http://localhost:8000/api/v1`  
**Auth**: JWT Bearer token — `Authorization: Bearer <access_token>`  
**Pagination**: 20 items/page — `?page=N`  
**Swagger UI**: `GET /api/docs/`  
**OpenAPI Schema**: `GET /api/schema/`

---

## Authentication

No token required for these endpoints.

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| `POST` | `/auth/token/` | `{ username, password }` | `{ access: string, refresh: string }` |
| `POST` | `/auth/token/refresh/` | `{ refresh: string }` | `{ access: string }` |

JWT access token expires — use refresh token to renew.

---

## Suppliers `/suppliers/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/suppliers/` | List all (paginated) |
| `POST` | `/suppliers/` | Create |
| `GET` | `/suppliers/{id}/` | Retrieve |
| `PUT` | `/suppliers/{id}/` | Full update |
| `PATCH` | `/suppliers/{id}/` | Partial update |
| `DELETE` | `/suppliers/{id}/` | Delete → 204 |

**Query params**: `?city=`, `?country=`, `?is_active=true|false`, `?search=<name|email|tax_id>`, `?ordering=name|-created_at`

**Request body (POST/PUT)**:
```json
{
  "name": "string (required)",
  "tax_id": "string (unique, optional)",
  "email": "string (required)",
  "phone": "string (optional)",
  "address": "string (optional)",
  "city": "string (required)",
  "country": "string (required)",
  "is_active": "boolean (default: true)"
}
```

---

## Warehouses `/warehouses/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/warehouses/` | List all (paginated) |
| `POST` | `/warehouses/` | Create |
| `GET` | `/warehouses/{id}/` | Retrieve |
| `PUT` | `/warehouses/{id}/` | Full update |
| `PATCH` | `/warehouses/{id}/` | Partial update |
| `DELETE` | `/warehouses/{id}/` | Delete → 204 |
| `GET` | `/warehouses/{id}/stock/` | List products in stock |

**Query params**: `?city=`, `?country=`, `?is_active=true|false`, `?search=<name|address|city>`, `?ordering=name|-capacity|-created_at`

**Request body (POST/PUT)**:
```json
{
  "name": "string (required)",
  "address": "string (required)",
  "city": "string (required)",
  "country": "string (required)",
  "latitude": "decimal(9,6) (optional)",
  "longitude": "decimal(9,6) (optional)",
  "capacity": "integer (required)",
  "is_active": "boolean (default: true)"
}
```

---

## Customers `/customers/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/customers/` | List all (paginated) |
| `POST` | `/customers/` | Create |
| `GET` | `/customers/{id}/` | Retrieve |
| `PUT` | `/customers/{id}/` | Full update |
| `PATCH` | `/customers/{id}/` | Partial update |
| `DELETE` | `/customers/{id}/` | Delete → 204 |

**Query params**: `?customer_type=company|individual`, `?city=`, `?country=`, `?is_active=true|false`, `?search=<name|email|tax_id>`, `?ordering=name|customer_type|-created_at`

**Request body (POST/PUT)**:
```json
{
  "name": "string (required)",
  "customer_type": "company | individual (required)",
  "tax_id": "string (unique, optional)",
  "email": "string (required)",
  "phone": "string (optional)",
  "address": "string (optional)",
  "city": "string (required)",
  "country": "string (required)",
  "is_active": "boolean (default: true)"
}
```

---

## Products `/products/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products/` | List all (paginated) |
| `POST` | `/products/` | Create |
| `GET` | `/products/{id}/` | Retrieve |
| `PUT` | `/products/{id}/` | Full update |
| `PATCH` | `/products/{id}/` | Partial update |
| `DELETE` | `/products/{id}/` | Delete → 204 |

**Query params**: `?category=`, `?supplier=<id>`, `?is_active=true|false`, `?search=<name|sku>`, `?ordering=name|unit_price|-created_at`

**Request body (POST/PUT)**:
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "sku": "string (unique, required)",
  "category": "string (required)",
  "unit_price": "decimal(10,2) (required)",
  "weight_kg": "decimal(6,3) (required)",
  "supplier": "integer FK (optional)",
  "is_active": "boolean (default: true)"
}
```

---

## Drivers `/drivers/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/drivers/` | List all (paginated, includes user_detail) |
| `POST` | `/drivers/` | Create (requires existing auth.User id) |
| `GET` | `/drivers/{id}/` | Retrieve |
| `PUT` | `/drivers/{id}/` | Full update |
| `PATCH` | `/drivers/{id}/` | Partial update |
| `DELETE` | `/drivers/{id}/` | Delete → 204 |

**Query params**: `?is_available=true|false`, `?search=<license_number|phone>`, `?ordering=license_expiry|-created_at`

**Request body (POST/PUT)**:
```json
{
  "user": "integer (FK to auth.User, required)",
  "license_number": "string (unique, required)",
  "license_expiry": "date YYYY-MM-DD (required)",
  "phone": "string (required)",
  "is_available": "boolean (default: true)"
}
```

**Response includes nested** `user_detail: { id, username, email, first_name, last_name }` (read-only).

---

## Transports `/transports/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/transports/` | List all (paginated, includes driver_detail) |
| `POST` | `/transports/` | Create |
| `GET` | `/transports/{id}/` | Retrieve |
| `PUT` | `/transports/{id}/` | Full update |
| `PATCH` | `/transports/{id}/` | Partial update |
| `DELETE` | `/transports/{id}/` | Delete → 204 |

**Query params**: `?transport_type=truck|van|motorcycle|bicycle`, `?is_active=true|false`, `?driver=<id>`, `?search=<name|plate_number>`, `?ordering=name|capacity_kg|-created_at`

**Request body (POST/PUT)**:
```json
{
  "name": "string (required)",
  "plate_number": "string (unique, required)",
  "transport_type": "truck | van | motorcycle | bicycle (required)",
  "capacity_kg": "decimal(8,2) (required)",
  "driver": "integer FK (optional)",
  "is_active": "boolean (default: true)"
}
```

**Response includes nested** `driver_detail: { id, license_number, phone, is_available }` when driver assigned (read-only).

---

## Routes `/routes/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/routes/` | List all (paginated) |
| `POST` | `/routes/` | Create |
| `GET` | `/routes/{id}/` | Retrieve |
| `PUT` | `/routes/{id}/` | Full update |
| `PATCH` | `/routes/{id}/` | Partial update |
| `DELETE` | `/routes/{id}/` | Delete → 204 |
| `GET` | `/routes/{id}/stops/` | List stops for route |
| `POST` | `/routes/{id}/stops/` | Add stop to route |
| `GET` | `/routes/{id}/stops/{stop_id}/` | Retrieve stop |
| `PUT` | `/routes/{id}/stops/{stop_id}/` | Full update stop |
| `PATCH` | `/routes/{id}/stops/{stop_id}/` | Partial update stop |
| `DELETE` | `/routes/{id}/stops/{stop_id}/` | Delete stop → 204 |

**Query params**: `?status=planned|in_progress|completed|cancelled`, `?transport=<id>`, `?origin_warehouse=<id>`, `?search=<name>`, `?ordering=name|status|-created_at|started_at`

**Route request body (POST/PUT)**:
```json
{
  "name": "string (required)",
  "origin_warehouse": "integer FK (required)",
  "transport": "integer FK (required)",
  "status": "planned | in_progress | completed | cancelled (default: planned)",
  "estimated_duration_hours": "decimal(5,2) (optional)",
  "started_at": "datetime ISO 8601 (optional)",
  "completed_at": "datetime ISO 8601 (optional)"
}
```

**RouteStop request body (POST/PUT)**:
```json
{
  "stop_order": "integer (required, unique per route)",
  "address": "string (required)",
  "city": "string (required)",
  "latitude": "decimal(9,6) (optional)",
  "longitude": "decimal(9,6) (optional)",
  "estimated_arrival": "datetime ISO 8601 (optional)",
  "actual_arrival": "datetime ISO 8601 (optional)"
}
```

**Validation**: duplicate `stop_order` in same route → 400 `"Ya existe una parada con este orden en la ruta."`

---

## Shipments `/shipments/`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/shipments/` | List all (paginated, nested items) |
| `POST` | `/shipments/` | Create with nested items |
| `GET` | `/shipments/{id}/` | Retrieve with nested items |
| `PUT` | `/shipments/{id}/` | Full update (items separately) |
| `PATCH` | `/shipments/{id}/` | Partial update |
| `DELETE` | `/shipments/{id}/` | Delete → 204 |
| `PATCH` | `/shipments/{id}/status/` | Status-only transition update |

**Query params**: `?status=pending|processing|in_transit|delivered|cancelled|returned`, `?customer=<id>`, `?origin_warehouse=<id>`, `?route=<id>`, `?search=<tracking_number|destination_city|destination_country>`, `?ordering=scheduled_delivery_date|-created_at|status`

**Shipment request body (POST)**:
```json
{
  "tracking_number": "string (unique, required)",
  "customer": "integer FK (required)",
  "origin_warehouse": "integer FK (required)",
  "route": "integer FK (optional)",
  "destination_address": "string (required)",
  "destination_city": "string (required)",
  "destination_country": "string (required)",
  "status": "pending (default)",
  "scheduled_delivery_date": "date YYYY-MM-DD (required)",
  "actual_delivery_date": "date YYYY-MM-DD (optional)",
  "total_weight_kg": "decimal(8,2) (required)",
  "notes": "string (optional)",
  "items": [
    {
      "product": "integer FK (required)",
      "quantity": "integer (required)",
      "unit_price_at_shipment": "decimal(10,2) (required)"
    }
  ]
}
```

**Status transition body**:
```json
{ "status": "processing | in_transit | delivered | cancelled | returned" }
```

**Valid status transitions**:
```
pending     → processing, cancelled
processing  → in_transit, cancelled
in_transit  → delivered, returned
delivered   → (final)
cancelled   → (final)
returned    → (final)
```

Invalid transition → 400 `"Transición de '{old}' a '{new}' no está permitida."`  
Duplicate product in items → 400 `"No puede haber dos ítems con el mismo producto."`
