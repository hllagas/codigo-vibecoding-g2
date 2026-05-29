# Frontend Architecture — SDD Plan

Schema-Driven Development: types → services → hooks → UI. Every layer derives from `docs/data-models.md`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| State | React built-ins (useState, useReducer) + custom hooks |
| HTTP | Fetch API via service layer |
| Auth | JWT stored in `localStorage`, refreshed on 401 |

---

## Folder Structure (target)

```
src/
├── types/                     # Step 1 — derive from data-models.md
│   ├── auth.ts
│   ├── supplier.ts
│   ├── warehouse.ts
│   ├── customer.ts
│   ├── product.ts
│   ├── driver.ts
│   ├── transport.ts
│   ├── route.ts
│   └── shipment.ts
│
├── lib/
│   ├── api.ts                 # Base fetch wrapper (auth headers, 401 refresh, error handling)
│   └── auth.ts                # Token storage helpers (get/set/clear)
│
├── services/                  # Step 2 — one file per module
│   ├── authService.ts
│   ├── supplierService.ts
│   ├── warehouseService.ts
│   ├── customerService.ts
│   ├── productService.ts
│   ├── driverService.ts
│   ├── transportService.ts
│   ├── routeService.ts
│   └── shipmentService.ts
│
├── hooks/                     # Step 3 — one hook per resource
│   ├── useAuth.ts
│   ├── useSuppliers.ts
│   ├── useWarehouses.ts
│   ├── useCustomers.ts
│   ├── useProducts.ts
│   ├── useDrivers.ts
│   ├── useTransports.ts
│   ├── useRoutes.ts
│   └── useShipments.ts
│
├── components/
│   ├── ui/                    # Generic: Button, Input, Badge, Table, Modal, Pagination
│   ├── layout/                # AppShell, Sidebar, Header, Breadcrumb
│   └── [module]/              # Module-specific: SupplierForm, ShipmentStatusBadge, etc.
│
└── app/                       # Next.js App Router pages
    ├── layout.tsx             # Root: auth guard, sidebar
    ├── login/
    │   └── page.tsx
    ├── suppliers/
    │   ├── page.tsx           # List
    │   └── [id]/page.tsx      # Detail + Edit
    ├── warehouses/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── customers/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── products/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── drivers/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── transports/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── routes/
    │   ├── page.tsx
    │   └── [id]/page.tsx      # Detail includes RouteStop management
    └── shipments/
        ├── page.tsx
        └── [id]/page.tsx      # Detail includes status transitions + items
```

---

## SDD Build Order

Follow this order strictly — each layer depends on the previous.

### 1. Types (`src/types/`)
Copy interfaces from `docs/data-models.md`. No logic, pure TypeScript.

### 2. API base (`src/lib/api.ts`)
Fetch wrapper that:
- Attaches `Authorization: Bearer <token>` header
- On 401: calls refresh, retries once, then redirects to `/login`
- Returns typed response or throws with parsed error message

### 3. Services (`src/services/`)
One function per endpoint. No state, no side effects, just HTTP.

```typescript
// pattern
export async function listSuppliers(params?: SupplierListParams) {
  return apiGet<PaginatedResponse<Supplier>>('/suppliers/', params);
}
export async function createSupplier(data: SupplierCreate) {
  return apiPost<Supplier>('/suppliers/', data);
}
```

### 4. Hooks (`src/hooks/`)
Wrap services with `useState` + `useEffect`. Expose: `data`, `loading`, `error`, `refetch`, `mutate`.

```typescript
// pattern
export function useSuppliers(params?: SupplierListParams) {
  const [data, setData] = useState<PaginatedResponse<Supplier> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ...
}
```

### 5. Components + Pages
Build UI consuming hooks. Pages = data orchestration. Components = presentation.

---

## Auth Flow

1. User hits any protected route → check `localStorage` for `access` token
2. No token → redirect to `/login`
3. Login page: POST `/auth/token/` → store `access` + `refresh` in `localStorage`
4. API wrapper: every request includes `Authorization: Bearer <access>`
5. On 401: POST `/auth/token/refresh/` → update `access` → retry original request
6. On refresh failure → clear tokens → redirect `/login`

---

## Module Pages (per module pattern)

Each module follows the same page pattern:

| Page | Route | Features |
|---|---|---|
| List | `/[module]/` | Table + filters + pagination + "New" button |
| Detail/Edit | `/[module]/[id]/` | View fields + inline edit form + delete |
| (Shipments only) | `/shipments/[id]/` | + Status transition buttons + items table |
| (Routes only) | `/routes/[id]/` | + RouteStops CRUD sub-table |

---

## Key UX Constraints

- **Shipment status**: only show valid next-status buttons per `SHIPMENT_VALID_TRANSITIONS`. Disable all if status is final (delivered, cancelled, returned).
- **Driver FK on Transport**: dropdown of available drivers (`?is_available=true`).
- **Supplier FK on Product**: dropdown of active suppliers (`?is_active=true`).
- **Route detail page**: nested RouteStop management (add/edit/delete stops, ordered by `stop_order`).
- **Shipment create**: multi-item form — dynamically add/remove product rows before submit.
- **Warehouse stock**: read-only view at `/warehouses/{id}/stock/`.
- **Decimal fields** (prices, weights, coordinates): display formatted, send as string to API.
- **Dates**: display localized, send as `YYYY-MM-DD` or ISO 8601 to API.

---

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Never hardcode base URL. Always use `process.env.NEXT_PUBLIC_API_URL`.
