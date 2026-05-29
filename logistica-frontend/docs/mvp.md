# MVP — logistica-frontend

Logistics management SPA frontend for `logistica-api`. One module at a time, in dependency order.

**Methodology**: SDD — Spec → [Human Approval] → Implement → Validate  
**Orchestrator**: `.claude/agents/orchestrator.md`

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔵 | Spec written — awaiting approval |
| 🟡 | Spec approved — in progress |
| 🟢 | Validated — complete |

---

## Module Order & Status

| # | Module | Status | Spec file |
|---|--------|--------|-----------|
| 0 | **Auth** | 🟢 | `docs/specs/auth-spec.md` |
| 1 | **Suppliers** | 🟢 | `docs/specs/suppliers-spec.md` |
| 2 | **Warehouses** | 🟢 | `docs/specs/warehouses-spec.md` |
| 3 | **Customers** | 🟢 | `docs/specs/customers-spec.md` |
| 4 | **Products** | 🟡 | `docs/specs/products-spec.md` |
| 5 | **Drivers** | 🟡 | `docs/specs/drivers-spec.md` |
| 6 | **Transports** | 🟡 | `docs/specs/transports-spec.md` |
| 7 | **Routes** | 🟡 | `docs/specs/routes-spec.md` |
| 8 | **Shipments** | 🟢 | `docs/specs/shipments-spec.md` |

---

## Module Descriptions

### 0. Auth
**Goal**: JWT login flow + protected routes + token lifecycle.

**Work**:
- Login page (`/login`) with username/password form
- Zustand `authStore`: store `access` + `refresh` tokens, `isAuthenticated` flag, `logout` action
- Axios instance (`src/lib/api.ts`) with request interceptor (attach Bearer token) and response interceptor (401 → refresh → retry → logout)
- Auth token helpers (`src/lib/auth.ts`): get/set/clear tokens from localStorage
- Root layout auth guard: redirect unauthenticated users to `/login`
- Sidebar/header layout for authenticated pages

**No backend CRUD** — two endpoints only: `POST /auth/token/` and `POST /auth/token/refresh/`.

---

### 1. Suppliers
**Goal**: Full CRUD for supplier companies.

**Work**:
- Types: `Supplier`, `SupplierCreate`, `SupplierUpdate`
- Service: list (+ filters), get, create, update, patch, delete
- Hook: list with pagination/filter state, single, mutations
- Table: name, email, city, country, is_active badge, actions column
- Form: create/edit (modal or drawer), all required fields + optional fields
- Filters bar: search (name/email/tax_id), city dropdown, country dropdown, is_active toggle
- List page + detail/edit page

**Dependencies**: Auth (must be complete first).

---

### 2. Warehouses
**Goal**: Full CRUD for warehouses + read-only stock view.

**Work**:
- Types: `Warehouse`, `WarehouseCreate`, `WarehouseUpdate`, `WarehouseStock`
- Service: list, get, create, update, patch, delete, getStock(id)
- Hook: list with pagination/filter state, single, mutations, stock query
- Table: name, city, country, capacity, is_active badge, actions column
- Form: create/edit with all fields (including optional lat/long)
- Filters bar: city, country, is_active toggle
- Detail page: warehouse info + read-only stock sub-table (product name, quantity)

**Dependencies**: Auth.

---

### 3. Customers
**Goal**: Full CRUD for customer records.

**Work**:
- Types: `Customer`, `CustomerType` union, `CustomerCreate`, `CustomerUpdate`
- Service: list (+ filters), get, create, update, patch, delete
- Hook: list with pagination/filter state, single, mutations
- Table: name, customer_type badge, email, city, country, is_active badge, actions
- Form: create/edit with customer_type selector (company | individual)
- Filters bar: customer_type select, city, country, is_active toggle, search

**Dependencies**: Auth.

---

### 4. Products
**Goal**: Full CRUD for products, linked to Suppliers.

**Work**:
- Types: `Product`, `ProductCreate`, `ProductUpdate`
- Service: list (+ filters), get, create, update, patch, delete
- Hook: list, single, mutations
- Table: name, SKU, category, unit_price, weight_kg, supplier name, is_active badge, actions
- Form: create/edit with supplier dropdown (fetches active suppliers from suppliersService)
- Filters bar: category input, supplier select, is_active toggle, search (name/sku)

**Dependencies**: Auth, Suppliers (FK dropdown in form).

---

### 5. Drivers
**Goal**: Full CRUD for drivers (linked to Django auth users).

**Work**:
- Types: `Driver`, `DriverCreate`, `DriverUpdate`, `UserDetail`
- Service: list (+ filters), get, create, update, patch, delete
- Hook: list, single, mutations
- Table: full name (from user_detail), license_number, license_expiry, phone, is_available badge, actions
- Form: create requires existing user ID input (no user creation in frontend), license fields
- License expiry: date picker, show warning if expired or near expiry
- Filters bar: is_available toggle, search (license/phone)

**Dependencies**: Auth.

---

### 6. Transports
**Goal**: Full CRUD for vehicles, linked to Drivers.

**Work**:
- Types: `Transport`, `TransportType` union, `TransportCreate`, `TransportUpdate`, `DriverDetail`
- Service: list (+ filters), get, create, update, patch, delete
- Hook: list, single, mutations
- Table: name, plate_number, transport_type badge, capacity_kg, driver name (from driver_detail), is_active badge, actions
- Form: create/edit with transport_type select + driver dropdown (fetches available drivers `?is_available=true`)
- Filters bar: transport_type select, is_active toggle, driver select, search (name/plate)

**Dependencies**: Auth, Drivers (FK dropdown in form).

---

### 7. Routes
**Goal**: Full CRUD for routes + nested RouteStop management.

**Work**:
- Types: `Route`, `RouteStatus` union, `RouteCreate`, `RouteUpdate`, `RouteStop`, `RouteStopCreate`, `RouteStopUpdate`
- Service: list, get, create, update, patch, delete + stop CRUD (listStops, createStop, updateStop, deleteStop)
- Hook: list routes, single route, route mutations + stops query, stops mutations
- Table: name, origin_warehouse name, transport name, status badge, estimated_duration_hours, started_at, actions
- Form: create/edit with warehouse dropdown + transport dropdown
- Status badge: color-coded (planned=blue, in_progress=yellow, completed=green, cancelled=red)
- Detail page: route info + **RouteStop sub-table** (stop_order, address, city, ETA, actual arrival) with add/edit/delete stops
- Stop form: stop_order (integer, validated unique per route), address, city, optional lat/long, optional arrival times
- Filters bar: status select, transport select, origin_warehouse select, search (name)

**Dependencies**: Auth, Warehouses (FK dropdown), Transports (FK dropdown).

---

### 8. Shipments
**Goal**: Full CRUD for shipments + nested items + status machine UI.

**Work**:
- Types: `Shipment`, `ShipmentStatus` union, `ShipmentItem`, `ShipmentCreate`, `ShipmentUpdate`, `ShipmentItemCreate`, `ShipmentStatusUpdate`
- Service: list, get, create, update, patch, delete, updateStatus(id, status)
- Hook: list, single, mutations, status mutation
- Table: tracking_number, customer name, destination_city, status badge, scheduled_delivery_date, total_weight_kg, actions
- Status badge: color-coded (pending=gray, processing=blue, in_transit=yellow, delivered=green, cancelled=red, returned=orange)
- Filters bar: status select, customer select, origin_warehouse select, route select, search (tracking/city/country)
- Create form: multi-step or single form with dynamic items list (add/remove product rows, each with product select + quantity + unit price)
- Detail page:
  - Shipment info display
  - Status transition panel: show current status + action buttons for valid next statuses only (use `SHIPMENT_VALID_TRANSITIONS`). Disable all buttons if status is final.
  - Items sub-table: product name, quantity, unit_price_at_shipment, line total (quantity × price)
- Validation: prevent creating shipment with duplicate products in items array (client-side before submit)

**Dependencies**: Auth, Customers (FK), Warehouses (FK), Routes (FK, optional), Products (FK in items).
