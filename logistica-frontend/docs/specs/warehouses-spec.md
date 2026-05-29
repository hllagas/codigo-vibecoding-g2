# Spec: Warehouses Module

**Status**: VALIDATED ✓
**Module**: warehouses (module 2)
**Backend ref**: `docs/api-reference.md#warehouses`
**Data models ref**: `docs/data-models.md#warehouse`

---

## Scope

Build full CRUD for warehouses plus a read-only per-warehouse stock view. Includes: TypeScript types, service layer (including the `/stock/` custom action), TanStack Query hooks (list with filters/pagination, single, mutations, stock sub-query), a TanStack Table component, a create/edit form with optional lat/long fields, a filters bar, a list page (with create dialog + delete confirmation + pagination), and a detail page (warehouse info + edit + delete + read-only stock sub-table). Depends on Auth module only — no other module FK is referenced.

---

## Infrastructure Audit (what NOT to create — already exists)

| File | Status |
|------|--------|
| `lib/api.ts` | EXISTS — exports `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete` |
| `lib/auth.ts` | EXISTS |
| `lib/queryClient.tsx` | EXISTS — exports `QueryProvider` and `queryClient` |
| `lib/utils.ts` | EXISTS — exports `cn` |
| `store/authStore.ts` | EXISTS |
| `types/pagination.ts` | EXISTS — exports `PaginatedResponse<T>` — **import, do NOT redefine** |
| `components/ui/button.tsx` | EXISTS |
| `components/ui/input.tsx` | EXISTS |
| `components/ui/label.tsx` | EXISTS |
| `components/ui/form.tsx` | EXISTS |
| `components/ui/badge.tsx` | EXISTS (installed for Suppliers) |
| `components/ui/dialog.tsx` | EXISTS (installed for Suppliers) |
| `components/ui/select.tsx` | EXISTS (installed for Suppliers) |
| `components/ui/skeleton.tsx` | EXISTS (installed for Suppliers) |
| `components/ui/table.tsx` | EXISTS (installed for Suppliers) |
| `components/ui/separator.tsx` | EXISTS (installed for Suppliers) |
| `components/ui/sonner.tsx` | EXISTS (installed for Suppliers) |
| `components/ui/StatusBadge.tsx` | EXISTS (created for Suppliers) — reuse directly |
| `app/(app)/layout.tsx` | EXISTS — auth guard + AppShell |

---

## shadcn/ui Components Audit

### Already installed (do NOT install again)
All components needed for this module are already installed from the Suppliers module:
`badge`, `dialog`, `select`, `skeleton`, `table`, `separator`, `sonner`, `button`, `input`, `label`, `form`

### New shadcn components needed
None. All required primitives are already present.

> Note: `StatusBadge` from `components/ui/StatusBadge.tsx` is reused as-is — no modification needed.

---

## Tasks

### 1. Types (`types/warehouse.ts`)

- [x] Import `PaginatedResponse` from `@/types/pagination` (do NOT redefine it here)
- [x] Define `Warehouse` interface:
  ```typescript
  interface Warehouse {
    id: number;
    name: string;
    address: string;
    city: string;
    country: string;
    latitude: string | null;   // decimal string from Django
    longitude: string | null;  // decimal string from Django
    capacity: number;
    is_active: boolean;
    created_at: string;        // ISO 8601
    updated_at: string;        // ISO 8601
  }
  ```
- [x] Define `WarehouseCreate` type:
  ```typescript
  type WarehouseCreate = Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>;
  ```
- [x] Define `WarehouseUpdate` type:
  ```typescript
  type WarehouseUpdate = Partial<WarehouseCreate>;
  ```
- [x] Define `WarehouseListParams` interface for query params:
  ```typescript
  interface WarehouseListParams {
    page?: number;
    search?: string;       // name | address | city
    city?: string;
    country?: string;
    is_active?: boolean;
    ordering?: string;     // 'name' | '-capacity' | '-created_at' | ...
  }
  ```
- [x] Define `WarehouseStock` interface:
  ```typescript
  interface WarehouseStock {
    id: number;
    warehouse: number;
    product: number;
    quantity: number;
    updated_at: string;    // ISO 8601
  }
  ```
- [x] Export all five from `types/warehouse.ts`: `Warehouse`, `WarehouseCreate`, `WarehouseUpdate`, `WarehouseListParams`, `WarehouseStock`

---

### 2. Service (`services/warehouseService.ts`)

All functions use the helpers from `lib/api.ts`. No state, no side effects.

- [x] Import `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete` from `@/lib/api`
- [x] Import `Warehouse`, `WarehouseCreate`, `WarehouseUpdate`, `WarehouseListParams`, `WarehouseStock` from `@/types/warehouse`
- [x] Import `PaginatedResponse` from `@/types/pagination`
- [x] Export `listWarehouses(params?: WarehouseListParams): Promise<PaginatedResponse<Warehouse>>`
  - `apiGet<PaginatedResponse<Warehouse>>('/warehouses/', { params })`
- [x] Export `getWarehouse(id: number): Promise<Warehouse>`
  - `apiGet<Warehouse>('/warehouses/${id}/')`
- [x] Export `createWarehouse(data: WarehouseCreate): Promise<Warehouse>`
  - `apiPost<Warehouse>('/warehouses/', data)`
- [x] Export `updateWarehouse(id: number, data: WarehouseCreate): Promise<Warehouse>`
  - `apiPut<Warehouse>('/warehouses/${id}/', data)`
- [x] Export `patchWarehouse(id: number, data: WarehouseUpdate): Promise<Warehouse>`
  - `apiPatch<Warehouse>('/warehouses/${id}/', data)`
- [x] Export `deleteWarehouse(id: number): Promise<void>`
  - `apiDelete<void>('/warehouses/${id}/')`
- [x] Export `getWarehouseStock(id: number): Promise<PaginatedResponse<WarehouseStock>>`
  - `apiGet<PaginatedResponse<WarehouseStock>>('/warehouses/${id}/stock/')`
  - Note: backend returns paginated response for stock — use `PaginatedResponse<WarehouseStock>`

---

### 3. Hooks

#### 3a. `hooks/useWarehouses.ts` — list with filters + pagination

- [x] Mark `'use client'` at top
- [x] Accept `params?: WarehouseListParams` argument
- [x] Use `useQuery` from `@tanstack/react-query`:
  - `queryKey: ['warehouses', params]`
  - `queryFn: () => listWarehouses(params)`
- [x] Return full `useQuery` result object (`{ data, isLoading, isError, error, refetch }`)
- [x] Export `useWarehouses` function

#### 3b. `hooks/useWarehouse.ts` — single warehouse by id

- [x] Mark `'use client'` at top
- [x] Accept `id: number | null` argument
- [x] Use `useQuery`:
  - `queryKey: ['warehouses', id]`
  - `queryFn: () => getWarehouse(id!)`
  - `enabled: !!id`
- [x] Return full `useQuery` result
- [x] Export `useWarehouse` function

#### 3c. `hooks/useWarehouseMutations.ts` — create / update / patch / delete

- [x] Mark `'use client'` at top
- [x] Import `queryClient` from `@/lib/queryClient`
- [x] Export `useCreateWarehouse()` hook:
  - `useMutation({ mutationFn: (data: WarehouseCreate) => createWarehouse(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouses'] }) })`
- [x] Export `useUpdateWarehouse()` hook:
  - `mutationFn: ({ id, data }: { id: number; data: WarehouseCreate }) => updateWarehouse(id, data)`
  - `onSuccess: (_, { id }) => { queryClient.invalidateQueries({ queryKey: ['warehouses'] }); queryClient.invalidateQueries({ queryKey: ['warehouses', id] }); }`
- [x] Export `usePatchWarehouse()` hook:
  - Same pattern as update but `data: WarehouseUpdate` and calls `patchWarehouse(id, data)`
- [x] Export `useDeleteWarehouse()` hook:
  - `mutationFn: (id: number) => deleteWarehouse(id)`
  - `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouses'] })`

#### 3d. `hooks/useWarehouseStock.ts` — stock list for a single warehouse

- [x] Mark `'use client'` at top
- [x] Accept `warehouseId: number | null` argument
- [x] Use `useQuery`:
  - `queryKey: ['warehouses', warehouseId, 'stock']`
  - `queryFn: () => getWarehouseStock(warehouseId!)`
  - `enabled: !!warehouseId`
- [x] Return full `useQuery` result
- [x] Export `useWarehouseStock` function

---

### 4. Components

#### 4a. `components/warehouses/WarehouseTable.tsx` — TanStack Table

- [x] Create `components/warehouses/WarehouseTable.tsx` — `'use client'`
- [x] Import `useReactTable`, `getCoreRowModel`, `flexRender`, `ColumnDef` from `@tanstack/react-table`
- [x] Import shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@/components/ui/table`
- [x] Import `StatusBadge` from `@/components/ui/StatusBadge`
- [x] Props:
  ```typescript
  interface WarehouseTableProps {
    data: Warehouse[];
    onEdit: (warehouse: Warehouse) => void;
    onDelete: (warehouse: Warehouse) => void;
    isLoading?: boolean;
  }
  ```
- [x] Define columns with `ColumnDef<Warehouse>[]`:
  - `name` — display `warehouse.name`, label "Almacén"
  - `city` — display `warehouse.city`, label "Ciudad"
  - `country` — display `warehouse.country`, label "País"
  - `capacity` — display `warehouse.capacity` (integer units), label "Capacidad"
  - `is_active` — render `<StatusBadge isActive={warehouse.is_active} />`, label "Estado"
  - `actions` — render icon buttons:
    - Edit: `variant="ghost"` size icon, Pencil icon, `aria-label="Editar almacén"`, calls `onEdit(row.original)`
    - Delete: `variant="ghost"` size icon, Trash2 icon, destructive color, `aria-label="Eliminar almacén"`, calls `onDelete(row.original)`
- [x] When `isLoading` is true: render 5 skeleton rows × column count cells using `Skeleton`
- [x] When data is empty and not loading: render "No hay almacenes" empty state row spanning all columns
- [x] Export `WarehouseTable`

#### 4b. `components/warehouses/WarehouseForm.tsx` — create/edit form

- [x] Create `components/warehouses/WarehouseForm.tsx` — `'use client'`
- [x] Props:
  ```typescript
  interface WarehouseFormProps {
    defaultValues?: Partial<WarehouseCreate>;
    onSubmit: (data: WarehouseCreate) => Promise<void>;
    isSubmitting?: boolean;
  }
  ```
- [x] Define zod schema:
  ```typescript
  const warehouseSchema = z.object({
    name:      z.string().min(1, 'El nombre es requerido'),
    address:   z.string().min(1, 'La dirección es requerida'),
    city:      z.string().min(1, 'La ciudad es requerida'),
    country:   z.string().min(1, 'El país es requerido'),
    latitude:  z.string().regex(/^-?\d{1,3}(\.\d{1,6})?$/, 'Formato inválido (ej: -12.345678)')
                 .optional()
                 .or(z.literal(''))
                 .transform(v => (v === '' || v === undefined) ? null : v),
    longitude: z.string().regex(/^-?\d{1,3}(\.\d{1,6})?$/, 'Formato inválido (ej: -77.012345)')
                 .optional()
                 .or(z.literal(''))
                 .transform(v => (v === '' || v === undefined) ? null : v),
    capacity:  z.coerce.number().int().positive('La capacidad debe ser un entero positivo'),
    is_active: z.boolean().default(true),
  });
  ```
  - Note: `latitude` and `longitude` are decimal strings per Django convention (e.g., `"-12.345678"`). The form collects them as strings and sends as-is (or null if empty). `capacity` uses `z.coerce.number()` because HTML inputs return strings.
- [x] Use `useForm<z.infer<typeof warehouseSchema>>` with `zodResolver(warehouseSchema)` and `defaultValues`
- [x] Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` for each field
- [x] Fields layout (2-column grid on md+, 1-column on mobile):
  - Row 1: `name` (full width) — required
  - Row 2: `address` (full width) — required
  - Row 3: `city` (left), `country` (right) — both required
  - Row 4: `capacity` (left, number input) — required; `is_active` (right, checkbox/toggle with label "Activo")
  - Row 5: `latitude` (left, text input), `longitude` (right, text input) — both optional; hint text below each: "Decimal (ej: -12.345678)" / "Decimal (ej: -77.012345)"
- [x] Submit button: label "Guardar" normally, "Guardando…" + disabled when `isSubmitting`
- [x] Export `WarehouseForm`

#### 4c. `components/warehouses/WarehouseFilters.tsx` — filters bar

- [x] Create `components/warehouses/WarehouseFilters.tsx` — `'use client'`
- [x] Props:
  ```typescript
  interface WarehouseFiltersProps {
    params: WarehouseListParams;
    onChange: (params: WarehouseListParams) => void;
  }
  ```
- [x] Render a horizontal flex bar (wraps on mobile) with:
  - **City input**: `placeholder="Ciudad"` — on blur/enter calls `onChange({ ...params, city: value || undefined, page: 1 })`
  - **Country input**: `placeholder="País"` — on blur/enter calls `onChange({ ...params, country: value || undefined, page: 1 })`
  - **Active status select** (shadcn `Select`): options "Todos", "Activo", "Inactivo" — calls `onChange({ ...params, is_active: value, page: 1 })` where "Todos" sets `is_active: undefined`
  - **Clear filters button**: visible only when any filter is active (city, country, or is_active are set) — resets params to `{ page: 1 }`
- [x] No search debounce needed: the backend `?search=` searches name/address/city and it is sent via city/country inputs directly; no separate search field is required (filters are city + country + is_active only per MVP)
- [x] Use `Input` from `@/components/ui/input`, `Select` from `@/components/ui/select`, `Button` from `@/components/ui/button`
- [x] Export `WarehouseFilters`

#### 4d. `components/warehouses/WarehouseStockTable.tsx` — read-only stock sub-table

- [x] Create `components/warehouses/WarehouseStockTable.tsx` — `'use client'`
- [x] Props:
  ```typescript
  interface WarehouseStockTableProps {
    data: WarehouseStock[];
    isLoading?: boolean;
  }
  ```
- [x] Define columns with `ColumnDef<WarehouseStock>[]`:
  - `product` — display `stock.product` (product ID as number), label "Producto (ID)"
    > NOTE: Product names are not available until the Products module (module 4) is built. Display the raw `product` ID for now. This column should be updated in the Products module spec to show the product name via a lookup.
  - `quantity` — display `stock.quantity`, label "Cantidad"
  - `updated_at` — display formatted date/time (use `new Date(stock.updated_at).toLocaleDateString('es-PE')`), label "Última actualización"
- [x] When `isLoading`: render 3 skeleton rows × 3 columns
- [x] When empty: render "Sin stock registrado" spanning all columns
- [x] No action column — this table is read-only
- [x] Export `WarehouseStockTable`

---

### 5. Pages

#### 5a. `app/(app)/warehouses/page.tsx` — list page

- [x] Create `app/(app)/warehouses/page.tsx` — `'use client'`
- [x] Local state:
  - `params: WarehouseListParams` initialized to `{ page: 1 }`
  - `isCreateOpen: boolean` — controls create Dialog visibility
  - `warehouseToDelete: Warehouse | null` — controls delete confirm Dialog
- [x] Fetch: `const { data, isLoading, isError } = useWarehouses(params)`
- [x] Mutation hooks: `const createMutation = useCreateWarehouse()`; `const deleteMutation = useDeleteWarehouse()`
- [x] `const PAGE_SIZE = 20` — derived from backend default
- [x] Render layout:
  - **Page header**: title "Almacenes" + "Nuevo almacén" Button that sets `isCreateOpen = true`
  - `<WarehouseFilters params={params} onChange={setParams} />`
  - `<WarehouseTable data={data?.results ?? []} isLoading={isLoading} onEdit={handleEdit} onDelete={setWarehouseToDelete} />`
  - **Pagination**: "Página X de Y" display + Prev/Next buttons
    - Total pages: `Math.ceil((data?.count ?? 0) / PAGE_SIZE)`
    - Prev disabled when `params.page === 1`
    - Next disabled when `data?.next === null`
    - Clicking Prev/Next updates `params.page`
  - **Create Dialog**: wraps `<WarehouseForm>` inside shadcn `Dialog`
    - `onSubmit`: calls `createMutation.mutateAsync(data)`, closes dialog on success, shows sonner toast "Almacén creado"
    - Dialog title: "Nuevo almacén"
  - **Delete confirmation Dialog**: triggered when `warehouseToDelete !== null`
    - Content: "¿Eliminar almacén {warehouseToDelete.name}? Esta acción no se puede deshacer."
    - Confirm button (destructive): calls `deleteMutation.mutateAsync(warehouseToDelete.id)`, then `setWarehouseToDelete(null)`, shows toast "Almacén eliminado"
    - Cancel button: `setWarehouseToDelete(null)`
- [x] `handleEdit(warehouse)`: navigate to `/warehouses/${warehouse.id}` via `useRouter().push`
- [x] Error state: if `isError`, show error banner "Error al cargar almacenes"
- [x] Export default `WarehousesPage`

#### 5b. `app/(app)/warehouses/[id]/page.tsx` — detail + edit + delete + stock page

- [x] Create `app/(app)/warehouses/[id]/page.tsx` — `'use client'`
- [x] Read `id` from `useParams()`, parse to number
- [x] State: `isEditing: boolean`, `isDeleteOpen: boolean`
- [x] Data hooks:
  - `const { data: warehouse, isLoading, isError } = useWarehouse(id)`
  - `const { data: stockData, isLoading: isStockLoading } = useWarehouseStock(id)`
- [x] Mutation hooks: `const updateMutation = useUpdateWarehouse()`; `const deleteMutation = useDeleteWarehouse()`
- [x] **Read mode render**:
  - Breadcrumb: "Almacenes / {warehouse.name}" with back link to `/warehouses`
  - Detail card with all fields:
    - name, address, city, country
    - latitude (display `warehouse.latitude ?? '—'`), longitude (display `warehouse.longitude ?? '—'`)
    - capacity (integer)
    - `<StatusBadge isActive={warehouse.is_active} />`
    - created_at formatted (`new Date(warehouse.created_at).toLocaleDateString('es-PE')`)
    - updated_at formatted
  - Action buttons: "Editar" (sets `isEditing = true`) + "Eliminar" (sets `isDeleteOpen = true`)
  - **Stock sub-section** (below detail card):
    - Section title: "Stock en este almacén"
    - `<Separator />`
    - `<WarehouseStockTable data={stockData?.results ?? []} isLoading={isStockLoading} />`
    - Note in UI (small muted text): "Los nombres de productos estarán disponibles cuando el módulo de Productos esté completo."
- [x] **Edit mode render** (when `isEditing === true`):
  - Replace detail card with `<WarehouseForm defaultValues={warehouse} onSubmit={handleUpdate} isSubmitting={updateMutation.isPending} />`
  - "Cancelar" button that sets `isEditing = false`
  - On submit: calls `updateMutation.mutateAsync({ id, data })`, exits edit mode on success, shows toast "Almacén actualizado"
- [x] **Delete Dialog**: triggered when `isDeleteOpen === true`
  - Content: "¿Eliminar almacén {warehouse?.name}? Esta acción no se puede deshacer."
  - Confirm (destructive): calls `deleteMutation.mutateAsync(id)` then `router.push('/warehouses')`, shows toast "Almacén eliminado"
  - Cancel: `setIsDeleteOpen(false)`
- [x] Loading state: show `<Skeleton>` blocks for all fields while `isLoading`
- [x] Error state: if `isError`, show "Almacén no encontrado" with back link to `/warehouses`
- [x] Export default `WarehouseDetailPage`

---

### 6. Integration Checks

- [x] `types/pagination.ts` imported (not redefined) by `warehouseService.ts`
- [x] `types/warehouse.ts` exports: `Warehouse`, `WarehouseCreate`, `WarehouseUpdate`, `WarehouseListParams`, `WarehouseStock`
- [x] `services/warehouseService.ts` uses `apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete` from `@/lib/api` (no raw fetch/axios)
- [x] All hooks import `queryClient` from `@/lib/queryClient` (the exported singleton, not a new instance)
- [x] Cache invalidation:
  - create/delete: invalidates `['warehouses']`
  - update/patch: invalidates `['warehouses']` and `['warehouses', id]`
  - stock query key `['warehouses', id, 'stock']` is separate and not invalidated by mutations (stock is read-only from frontend)
- [x] `WarehouseTable` uses `@tanstack/react-table` (already in package.json — no install needed)
- [x] `StatusBadge` imported from `@/components/ui/StatusBadge` — no modifications to existing component
- [x] `WarehouseForm` latitude/longitude: empty string from input → `null` after zod transform before API call
- [x] `WarehouseForm` capacity: `z.coerce.number()` handles HTML string-to-number coercion
- [x] Pagination: Prev disabled at page 1, Next disabled when `data?.next === null`
- [x] Delete in list page is pessimistic: await mutation, then TanStack Query auto-refetches via invalidation
- [x] Sonner `<Toaster />` already present in `app/layout.tsx` from Suppliers module — no change needed
- [x] Sidebar: add `/warehouses` link to AppShell sidebar (check `app/(app)/layout.tsx` — may need to add the nav entry)
- [x] TypeScript strict: no `any` types in new files
- [x] `NEXT_PUBLIC_API_URL` must be set in `.env.local` — no change needed if already configured

---

## File Checklist (all files to create)

```
types/
└── warehouse.ts                              ← new

services/
└── warehouseService.ts                       ← new

hooks/
├── useWarehouses.ts                          ← new
├── useWarehouse.ts                           ← new
├── useWarehouseMutations.ts                  ← new
└── useWarehouseStock.ts                      ← new

components/
└── warehouses/
    ├── WarehouseTable.tsx                    ← new
    ├── WarehouseForm.tsx                     ← new
    ├── WarehouseFilters.tsx                  ← new
    └── WarehouseStockTable.tsx               ← new (read-only)

app/(app)/warehouses/
├── page.tsx                                  ← new
└── [id]/
    └── page.tsx                              ← new (includes stock sub-table)
```

**No new shadcn installs required.** All components from Suppliers module are reused.

---

## Notes & Decisions

1. **`WarehouseStock.product` shows ID, not name**: Until the Products module (module 4) is implemented, the stock sub-table shows `product` as a raw integer ID. The Products module spec should include a task to update `WarehouseStockTable` to resolve product IDs to names.

2. **`latitude` / `longitude` as decimal strings**: Django returns these as strings (e.g., `"-12.345600"`). The form collects them as plain text inputs and sends them as strings. Zod validates the format with a regex before submit. Empty input → `null`.

3. **`capacity` as integer**: `z.coerce.number().int()` handles the HTML input string-to-number conversion automatically.

4. **No search debounce in WarehouseFilters**: Per spec instructions, no debounce is needed. City and country inputs trigger on blur/enter. The backend's `?search=` param (which searches name, address, city) is not exposed as a separate filter in the UI for this module — city and country inputs are the primary filters.

5. **Stock endpoint pagination**: `GET /warehouses/{id}/stock/` returns a `PaginatedResponse<WarehouseStock>`. The stock sub-table on the detail page shows `stockData?.results ?? []`. For now, all stock items on the first page are displayed (pagination for the stock sub-table is out of scope for this module).

6. **Sidebar nav entry**: The AppShell sidebar in `app/(app)/layout.tsx` likely needs a new nav item for "Almacenes" pointing to `/warehouses`. Verify the sidebar nav array and add the entry if not present.

---

## Dependencies

- **Auth module** (module 0): complete — required for `lib/api.ts`, `lib/auth.ts`, `app/(app)/layout.tsx`, `queryClient`
- **Suppliers module** (module 1): complete — all shadcn components and `StatusBadge` are already installed/created
- **Products module** (module 4): NOT required to build this module, but stock product name resolution depends on it being built later

---

## Validation Report

**Status**: NEEDS FIXES

### TypeScript Errors (3)

1. **components/warehouses/WarehouseFilters.tsx:88** — Select onValueChange callback signature mismatch. Handler expects `(value: string)` but Select passes `(value: string | null)`. Add null check in handler.

2. **components/warehouses/WarehouseForm.tsx:50** — useForm resolver type mismatch. The zod schema infers `WarehouseFormValues` with `capacity: unknown` (from coerce) and optional lat/long producing `string | undefined`, but the form expects strict types. Either use `as const` assertion or restructure schema typing.

3. **components/warehouses/WarehouseForm.tsx:79** — Submission handler type mismatch from resolver issue above. Cannot pass `WarehouseFormValues` to `onSubmit(data: WarehouseCreate)` due to schema type inference.

### Non-TypeScript Issues (1)

4. **components/warehouses/WarehouseTable.tsx:120** — Empty state text is "No hay almacenes registrados" but spec requires "No hay almacenes".

### Passing Checks

- [x] All 7 service functions present with correct signatures
- [x] All 4 hooks present with correct query keys and invalidation
- [x] WarehouseStockTable is read-only with product ID column + muted note
- [x] WarehouseForm has zod schema with lat/long nullable transform
- [x] WarehouseFilters has city/country inputs + is_active select + clear button
- [x] List page has create dialog, delete confirm, pagination, sonner toasts
- [x] Detail page has view/edit modes, stock sub-section, proper formatting
- [x] Sidebar nav entry for "/warehouses" exists
- [x] PaginatedResponse NOT redefined in types/warehouse.ts

### Summary

**Failed items**: 4 (3 TS errors, 1 text)
**To fix**: WarehouseFilters handler null safety, WarehouseForm schema types, empty state text.
