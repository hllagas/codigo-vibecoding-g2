# Spec: Transports Module

**Status**: 🔵 AWAITING APPROVAL
**Module**: transports (module 6)
**Backend ref**: `docs/api-reference.md#transports`
**Data models ref**: `docs/data-models.md#transport`

---

## Scope

Build full CRUD for transport vehicles, linked to Drivers via an optional FK. Backend returns a read-only nested `driver_detail: { id, license_number, phone, is_available }` on every transport response — used to display driver info without a separate lookup. `transport_type` is a 4-value enum (`truck | van | motorcycle | bicycle`) — rendered as a badge in the table and a Select in the form. `capacity_kg` arrives as a decimal string from Django — stored and sent back as string. `driver` FK form field fetches available drivers (`?is_available=true`) from `useDrivers`. `plate_number` uniqueness enforced server-side — 400 error on duplicate must surface via toast.

Key differences from prior modules:
- `transport_type` enum — badge with distinct colors per type, Select in form/filters.
- `capacity_kg` decimal string — same pattern as `unit_price`/`weight_kg` in Products.
- `driver` is `number | null` — form Select with "Sin conductor" option; dropdown fetches available drivers only.
- `driver_detail` is `DriverDetail | null` — read-only, displayed in table + detail view, never sent to API.
- `plate_number` uniqueness is server-side — surface 400 errors to user.

---

## Infrastructure Audit (what NOT to create — already exists)

| File | Status |
|------|--------|
| `lib/api.ts` | EXISTS |
| `lib/queryClient.tsx` | EXISTS — exports `queryClient` singleton |
| `lib/utils.ts` | EXISTS — exports `cn` |
| `types/pagination.ts` | EXISTS — exports `PaginatedResponse<T>` |
| `types/driver.ts` | EXISTS — exports `Driver`, `DriverListParams` |
| `hooks/useDrivers.ts` | EXISTS — reuse for driver dropdown |
| `services/driverService.ts` | EXISTS |
| `components/ui/button.tsx` | EXISTS |
| `components/ui/input.tsx` | EXISTS |
| `components/ui/label.tsx` | EXISTS |
| `components/ui/form.tsx` | EXISTS |
| `components/ui/badge.tsx` | EXISTS |
| `components/ui/dialog.tsx` | EXISTS |
| `components/ui/select.tsx` | EXISTS |
| `components/ui/skeleton.tsx` | EXISTS |
| `components/ui/table.tsx` | EXISTS |
| `components/ui/separator.tsx` | EXISTS |
| `components/ui/sonner.tsx` | EXISTS |
| `components/ui/StatusBadge.tsx` | EXISTS — reuse for `is_active` |
| `app/(app)/layout.tsx` | EXISTS |
| `components/layout/Sidebar.tsx` | EXISTS — `/transports` link already present |

---

## shadcn/ui Components Audit

### Already installed — do NOT install again
`badge`, `dialog`, `select`, `skeleton`, `table`, `separator`, `sonner`, `button`, `input`, `label`, `form`

### New shadcn components needed
None.

---

## Tasks

### 1. Types (`types/transport.ts`)

- [ ] Define `TransportType` union:
  ```typescript
  export type TransportType = 'truck' | 'van' | 'motorcycle' | 'bicycle';
  ```
- [ ] Define `DriverDetail` interface (nested read-only from transport response):
  ```typescript
  export interface DriverDetail {
    id: number;
    license_number: string;
    phone: string;
    is_available: boolean;
  }
  ```
- [ ] Define `Transport` interface:
  ```typescript
  export interface Transport {
    id: number;
    name: string;
    plate_number: string;
    transport_type: TransportType;
    capacity_kg: string;           // decimal string from Django
    driver: number | null;
    driver_detail: DriverDetail | null; // read-only nested — never send to API
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  ```
- [ ] Define `TransportCreate` type:
  ```typescript
  export type TransportCreate = {
    name: string;
    plate_number: string;
    transport_type: TransportType;
    capacity_kg: string;
    driver: number | null;
    is_active: boolean;
  };
  ```
- [ ] Define `TransportUpdate` type:
  ```typescript
  export type TransportUpdate = Partial<TransportCreate>;
  ```
- [ ] Define `TransportListParams` interface:
  ```typescript
  export interface TransportListParams {
    page?: number;
    search?: string;             // name | plate_number
    transport_type?: TransportType;
    is_active?: boolean;
    driver?: number;
    ordering?: string;
  }
  ```
- [ ] Export all from `types/transport.ts`

---

### 2. Service (`services/transportService.ts`)

- [ ] Import helpers from `@/lib/api`
- [ ] Import `Transport`, `TransportCreate`, `TransportUpdate`, `TransportListParams` from `@/types/transport`
- [ ] Import `PaginatedResponse` from `@/types/pagination`
- [ ] Export `listTransports(params?: TransportListParams): Promise<PaginatedResponse<Transport>>`
- [ ] Export `getTransport(id: number): Promise<Transport>`
- [ ] Export `createTransport(data: TransportCreate): Promise<Transport>`
- [ ] Export `updateTransport(id: number, data: TransportCreate): Promise<Transport>`
- [ ] Export `patchTransport(id: number, data: TransportUpdate): Promise<Transport>`
- [ ] Export `deleteTransport(id: number): Promise<void>`

All use `/transports/` and `/transports/${id}/` paths.

---

### 3. Hooks

#### 3a. `hooks/useTransports.ts`
- [ ] `'use client'`
- [ ] `useQuery({ queryKey: ['transports', params], queryFn: () => listTransports(params) })`
- [ ] Export `useTransports(params?: TransportListParams)`

#### 3b. `hooks/useTransport.ts`
- [ ] `'use client'`
- [ ] `useQuery({ queryKey: ['transports', id], queryFn: () => getTransport(id!), enabled: !!id })`
- [ ] Export `useTransport(id: number | null)`

#### 3c. `hooks/useTransportMutations.ts`
- [ ] `'use client'`
- [ ] Import `queryClient` from `@/lib/queryClient`
- [ ] Export `useCreateTransport()`:
  ```typescript
  useMutation({
    mutationFn: (data: TransportCreate) => createTransport(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transports'] }); },
  })
  ```
- [ ] Export `useUpdateTransport()`:
  ```typescript
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransportCreate }) => updateTransport(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      queryClient.invalidateQueries({ queryKey: ['transports', id] });
    },
  })
  ```
- [ ] Export `usePatchTransport()`:
  ```typescript
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransportUpdate }) => patchTransport(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      queryClient.invalidateQueries({ queryKey: ['transports', id] });
    },
  })
  ```
- [ ] Export `useDeleteTransport()`:
  ```typescript
  useMutation({
    mutationFn: (id: number) => deleteTransport(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transports'] }); },
  })
  ```

---

### 4. Components

#### 4a. `components/transports/TransportTypeBadge.tsx`

- [ ] `'use client'`
- [ ] Import `Badge` from `@/components/ui/badge`
- [ ] Import `TransportType` from `@/types/transport`
- [ ] Props: `{ transportType: TransportType }`
- [ ] Label map:
  ```typescript
  const LABELS: Record<TransportType, string> = {
    truck: 'Camión',
    van: 'Furgoneta',
    motorcycle: 'Moto',
    bicycle: 'Bicicleta',
  };
  ```
- [ ] Color map (via className):
  ```
  truck       → bg-blue-500 text-white
  van         → bg-purple-500 text-white
  motorcycle  → bg-orange-500 text-white
  bicycle     → bg-green-500 text-white
  ```
- [ ] Render: `<Badge className={COLOR_MAP[transportType]}>{LABELS[transportType]}</Badge>`
- [ ] Export `TransportTypeBadge`

#### 4b. `components/transports/TransportTable.tsx`

- [ ] `'use client'`
- [ ] Import TanStack Table primitives, shadcn Table, `Button`, `Skeleton`, `StatusBadge`, `TransportTypeBadge`, `Pencil`, `Trash2`
- [ ] Import `Transport` from `@/types/transport`
- [ ] Props:
  ```typescript
  interface TransportTableProps {
    data: Transport[];
    isLoading?: boolean;
    onEdit: (transport: Transport) => void;
    onDelete: (transport: Transport) => void;
  }
  ```
- [ ] Define columns `ColumnDef<Transport>[]`:
  - `name` — `<span className="font-medium">{row.original.name}</span>`, header "Vehículo"
  - `plate_number` — `row.original.plate_number`, header "Matrícula"
  - `transport_type` — `<TransportTypeBadge transportType={row.original.transport_type} />`, header "Tipo"
  - `capacity_kg` — `parseFloat(row.original.capacity_kg).toFixed(2) + ' kg'`, header "Capacidad"
  - `driver` — if `driver_detail !== null`: `driver_detail.license_number` else `'—'`, header "Conductor"
  - `is_active` — `<StatusBadge isActive={row.original.is_active} />`, header "Estado"
  - `actions` — Edit + Delete icon buttons (same pattern as prior modules)
- [ ] Loading: 5 skeleton rows
- [ ] Empty: "No hay transportes registrados"
- [ ] Export `TransportTable`

#### 4c. `components/transports/TransportForm.tsx`

- [ ] `'use client'`
- [ ] Import `useForm`, `zodResolver`, `z`, `Loader2`
- [ ] Import shadcn `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`
- [ ] Import `Input`, `Button`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- [ ] Import `useDrivers` from `@/hooks/useDrivers`
- [ ] Import `TransportCreate`, `TransportType` from `@/types/transport`
- [ ] Zod schema — **NO `.default()` or `.optional()`**:
  ```typescript
  const transportSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    plate_number: z.string().min(1, 'La matrícula es requerida'),
    transport_type: z.enum(['truck', 'van', 'motorcycle', 'bicycle'], {
      errorMap: () => ({ message: 'Selecciona un tipo de transporte' }),
    }),
    capacity_kg: z.string().min(1, 'La capacidad es requerida'),
    driver: z.string(),   // "none" or string id → convert in handleSubmit
    is_active: z.boolean(),
  });
  type TransportFormValues = z.infer<typeof transportSchema>;
  ```
- [ ] Props:
  ```typescript
  interface TransportFormProps {
    defaultValues?: Partial<TransportCreate>;
    onSubmit: (data: TransportCreate) => Promise<void>;
    isSubmitting?: boolean;
  }
  ```
- [ ] Fetch available drivers for dropdown:
  ```typescript
  const { data: driversData } = useDrivers({ is_available: true, page: 1 });
  const drivers = driversData?.results ?? [];
  ```
- [ ] `useForm<TransportFormValues>` with `zodResolver` and explicit `defaultValues`:
  ```typescript
  defaultValues: {
    name: defaultValues?.name ?? '',
    plate_number: defaultValues?.plate_number ?? '',
    transport_type: defaultValues?.transport_type ?? 'truck',
    capacity_kg: defaultValues?.capacity_kg ?? '',
    driver: defaultValues?.driver != null ? String(defaultValues.driver) : 'none',
    is_active: defaultValues?.is_active ?? true,
  }
  ```
- [ ] `handleSubmit(values: TransportFormValues)`:
  ```typescript
  const data: TransportCreate = {
    name: values.name.trim(),
    plate_number: values.plate_number.trim().toUpperCase(),
    transport_type: values.transport_type as TransportType,
    capacity_kg: values.capacity_kg.trim(),
    driver: values.driver === 'none' ? null : parseInt(values.driver, 10),
    is_active: values.is_active,
  };
  await onSubmit(data);
  ```
- [ ] Fields layout:
  - `name` Input — full width, label "Nombre *"
  - Row: `plate_number` Input (left), `transport_type` Select (right) — labels "Matrícula *", "Tipo *"
    - transport_type options: truck/Camión, van/Furgoneta, motorcycle/Moto, bicycle/Bicicleta
  - Row: `capacity_kg` Input type="text" placeholder="0.00" (left), `driver` Select (right) — labels "Capacidad (kg) *", "Conductor"
    - driver options: `value="none"` label "Sin conductor", then one per available driver `value={String(d.id)}` label `d.license_number`
  - `is_active` native checkbox + label "Activo"
- [ ] Submit button: "Guardar" / "Guardando…" + Loader2
- [ ] Export `TransportForm`

> **Note on edit + driver dropdown**: When editing, the assigned driver may not be available (`is_available=false`) and therefore won't appear in the dropdown (which fetches `?is_available=true`). Accept this limitation for MVP — user can set driver to "Sin conductor" and reassign. The current `driver_detail.license_number` is shown in the detail view.

#### 4d. `components/transports/TransportFilters.tsx`

- [ ] `'use client'`
- [ ] Import `useState`, `useEffect`, `useRef` from `react`
- [ ] Import `Input`, `Button`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- [ ] Import `useDrivers` from `@/hooks/useDrivers`
- [ ] Import `TransportListParams`, `TransportType` from `@/types/transport`
- [ ] Props: `{ params: TransportListParams; onChange: (params: TransportListParams) => void }`
- [ ] Local state: `searchValue: string`
- [ ] Sync `searchValue` via `useEffect` on `params.search`
- [ ] Debounce search 300ms
- [ ] `transport_type` select: values `'all'` / `'truck'` / `'van'` / `'motorcycle'` / `'bicycle'` → `onChange({ ...params, transport_type: resolved, page: 1 })`
- [ ] `is_active` select: `'all'` / `'true'` / `'false'` → map to `undefined | true | false`
- [ ] `driver` select: fetch `useDrivers({ page: 1 })` (all drivers, no availability filter) — `'all'` → `undefined`, else `parseInt(value)`; show `d.license_number` as label
- [ ] `hasActiveFilters`: any of `search`, `transport_type`, `is_active`, `driver` defined
- [ ] Clear button → `onChange({ page: 1 })`
- [ ] Render horizontal flex bar:
  - Search Input `className="w-full sm:w-64"` `placeholder="Buscar por nombre o matrícula…"`
  - Transport type Select `className="w-full sm:w-44"`: "Todos los tipos" + 4 type options with Spanish labels
  - Is active Select `className="w-full sm:w-36"`: "Todos" / "Activo" / "Inactivo"
  - Driver Select `className="w-full sm:w-48"`: "Todos los conductores" + driver options
  - Clear Button (visible when `hasActiveFilters`)
- [ ] Export `TransportFilters`

---

### 5. Pages

#### 5a. `app/(app)/transports/page.tsx` — list page

- [ ] `'use client'`
- [ ] State: `params: TransportListParams` (init `{ page: 1 }`), `isCreateOpen: boolean`, `transportToDelete: Transport | null`
- [ ] `const PAGE_SIZE = 20`
- [ ] Fetch: `useTransports(params)`, mutations: `useCreateTransport()`, `useDeleteTransport()`
- [ ] Handlers:
  - `handleEdit(t)` → `router.push(`/transports/${t.id}`)`
  - `handleDeleteClick(t)` → `setTransportToDelete(t)`
  - `handleDeleteConfirm()` → `deleteMutation.mutateAsync(transportToDelete!.id)`, clear state, `toast.success('Transporte eliminado')`
  - `handleCreate(data)` → `createMutation.mutateAsync(data)`, close dialog, `toast.success('Transporte creado')`
- [ ] Render:
  - Header: "Transportes" h1 + "Nuevo transporte" Button
  - `TransportFilters`
  - Error state
  - `TransportTable`
  - Pagination row (same pattern as prior modules)
  - Create Dialog + Delete confirm Dialog
- [ ] Export default `TransportsPage`

#### 5b. `app/(app)/transports/[id]/page.tsx` — detail + edit page

- [ ] `'use client'`
- [ ] Parse `id` from `useParams`
- [ ] Fetch: `useTransport(id)`, mutations: `useUpdateTransport()`, `useDeleteTransport()`
- [ ] State: `isEditing`, `isDeleteOpen`
- [ ] Loading: Skeleton blocks
- [ ] Error: "Transporte no encontrado" + back link
- [ ] Read mode:
  - Header: "← Transportes" link + transport name h1 + Edit + Delete buttons
  - `<Separator />`
  - `<dl>` grid 2-col:
    - Nombre, Matrícula, Tipo (`<TransportTypeBadge />`), Capacidad (formatted `.toFixed(2) + ' kg'`), Estado (`<StatusBadge />`), Conductor (license_number from `driver_detail` or `'—'`), Conductor disponible (`driver_detail?.is_available`), Creado, Actualizado
  - Delete confirm Dialog
- [ ] Edit mode: "Editar transporte" h1 + Cancel + `TransportForm defaultValues={transport}`
- [ ] `handleUpdate` → `updateMutation.mutateAsync({ id, data })`, `setIsEditing(false)`, `toast.success('Transporte actualizado')`
- [ ] `handleDeleteConfirm` → `deleteMutation.mutateAsync(id)`, `router.push('/transports')`, `toast.success('Transporte eliminado')`
- [ ] Export default `TransportDetailPage`

---

### 6. Integration Checks

- [ ] `types/transport.ts`: `TransportType`, `DriverDetail`, `Transport`, `TransportCreate`, `TransportUpdate`, `TransportListParams` all exported
- [ ] `DriverDetail` defined in `types/transport.ts` (NOT imported from `types/driver.ts` — different shape)
- [ ] Service uses `apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete` only
- [ ] All hooks import `queryClient` singleton from `@/lib/queryClient`
- [ ] Cache invalidation: create/delete → `['transports']`; update/patch → `['transports']` + `['transports', id]`
- [ ] `TransportCreate` sent to API: `name`, `plate_number`, `transport_type`, `capacity_kg` (string), `driver` (number|null), `is_active` — never `driver_detail`
- [ ] `TransportForm` stores `driver` as string (`'none'` or `'42'`), converts in `handleSubmit`
- [ ] `TransportForm` `transport_type` default `'truck'` set in `useForm({ defaultValues })` — NOT in zod schema
- [ ] `TransportForm` `capacity_kg` sent as string — Django accepts decimal string
- [ ] `plate_number` normalized to uppercase in `handleSubmit`
- [ ] `TransportFilters` driver Select fetches all drivers (no `is_available` filter) — filter by driver regardless of availability
- [ ] `TransportForm` driver Select fetches `?is_available=true` only — only available drivers assignable
- [ ] No new shadcn installs
- [ ] TypeScript strict: no `any`
- [ ] All new files `'use client'`

---

## File Checklist

```
types/
└── transport.ts                          ← new

services/
└── transportService.ts                   ← new

hooks/
├── useTransports.ts                      ← new
├── useTransport.ts                       ← new
└── useTransportMutations.ts              ← new

components/
└── transports/
    ├── TransportTypeBadge.tsx            ← new
    ├── TransportTable.tsx                ← new
    ├── TransportForm.tsx                 ← new
    └── TransportFilters.tsx              ← new

app/(app)/transports/
├── page.tsx                              ← new
└── [id]/
    └── page.tsx                          ← new
```

**Files to modify**: none — sidebar already has `/transports` link.

---

## Dependencies

- **Auth**: complete
- **Drivers**: complete — `useDrivers` reused for form dropdown + filter dropdown
- All packages installed
