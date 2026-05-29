# Spec: Drivers Module

**Status**: 🔵 AWAITING APPROVAL
**Module**: drivers (module 5)
**Backend ref**: `docs/api-reference.md#drivers`
**Data models ref**: `docs/data-models.md#driver`

---

## Scope

Build full CRUD for drivers, linked to Django `auth.User` via an integer FK. The backend returns a read-only nested `user_detail` object `{ id, username, email, first_name, last_name }` on every driver response — the frontend uses it to display the driver's full name without a separate user lookup. Create form accepts an existing `user` ID (no user creation in the frontend). `license_expiry` is a date string `YYYY-MM-DD` — the form uses a plain date input and the table/detail view shows a warning badge when the date is expired or within 30 days. `is_available` replaces `is_active` (same boolean pattern, different label). No FK to other custom models — only dependency is Auth.

Key differences from prior modules:
- `user_detail` nested object — read-only, never sent to the API. Display `first_name + last_name` or fall back to `username`.
- `user` field in form: plain integer input (no dropdown — no user list endpoint in the frontend).
- `license_expiry` date: warn if `<=` today (expired) or within 30 days (expiring soon). Warning shown in table and detail view.
- `is_available` is the availability flag (not `is_active`).

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
| `components/ui/badge.tsx` | EXISTS |
| `components/ui/dialog.tsx` | EXISTS |
| `components/ui/select.tsx` | EXISTS |
| `components/ui/skeleton.tsx` | EXISTS |
| `components/ui/table.tsx` | EXISTS |
| `components/ui/separator.tsx` | EXISTS |
| `components/ui/sonner.tsx` | EXISTS |
| `components/ui/StatusBadge.tsx` | EXISTS — **do NOT reuse for `is_available`** — create `DriverAvailabilityBadge` instead |
| `app/(app)/layout.tsx` | EXISTS — auth guard + AppShell |
| `components/layout/Sidebar.tsx` | EXISTS — `/drivers` link already present |

---

## shadcn/ui Components Audit

### Already installed (do NOT install again)
All components needed for this module are already installed:
`badge`, `dialog`, `select`, `skeleton`, `table`, `separator`, `sonner`, `button`, `input`, `label`, `form`

### New shadcn components needed
None.

---

## Tasks

### 1. Types (`types/driver.ts`)

- [ ] Define `UserDetail` interface:
  ```typescript
  export interface UserDetail {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  }
  ```
- [ ] Define `Driver` interface:
  ```typescript
  export interface Driver {
    id: number;
    user: number;
    user_detail: UserDetail;   // read-only, nested — never send to API
    license_number: string;
    license_expiry: string;    // date YYYY-MM-DD
    phone: string;
    is_available: boolean;
    created_at: string;        // ISO 8601
    updated_at: string;        // ISO 8601
  }
  ```
- [ ] Define `DriverCreate` type:
  ```typescript
  export type DriverCreate = {
    user: number;
    license_number: string;
    license_expiry: string;    // YYYY-MM-DD
    phone: string;
    is_available: boolean;
  };
  ```
- [ ] Define `DriverUpdate` type:
  ```typescript
  export type DriverUpdate = Partial<DriverCreate>;
  ```
- [ ] Define `DriverListParams` interface:
  ```typescript
  export interface DriverListParams {
    page?: number;
    search?: string;          // license_number | phone
    is_available?: boolean;
    ordering?: string;        // 'license_expiry' | '-created_at' | ...
  }
  ```
- [ ] Export all five from `types/driver.ts`

---

### 2. Service (`services/driverService.ts`)

- [ ] Import `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete` from `@/lib/api`
- [ ] Import `Driver`, `DriverCreate`, `DriverUpdate`, `DriverListParams` from `@/types/driver`
- [ ] Import `PaginatedResponse` from `@/types/pagination`
- [ ] Export `listDrivers(params?: DriverListParams): Promise<PaginatedResponse<Driver>>`
  - `apiGet<PaginatedResponse<Driver>>('/drivers/', { params })`
- [ ] Export `getDriver(id: number): Promise<Driver>`
  - `apiGet<Driver>(`/drivers/${id}/`)`
- [ ] Export `createDriver(data: DriverCreate): Promise<Driver>`
  - `apiPost<Driver>('/drivers/', data)`
- [ ] Export `updateDriver(id: number, data: DriverCreate): Promise<Driver>`
  - `apiPut<Driver>(`/drivers/${id}/`, data)`
- [ ] Export `patchDriver(id: number, data: DriverUpdate): Promise<Driver>`
  - `apiPatch<Driver>(`/drivers/${id}/`, data)`
- [ ] Export `deleteDriver(id: number): Promise<void>`
  - `apiDelete<void>(`/drivers/${id}/`)`

---

### 3. Hooks

#### 3a. `hooks/useDrivers.ts` — list with filters + pagination

- [ ] `'use client'`
- [ ] Accept `params?: DriverListParams`
- [ ] `useQuery({ queryKey: ['drivers', params], queryFn: () => listDrivers(params) })`
- [ ] Return full `useQuery` result
- [ ] Export `useDrivers`

#### 3b. `hooks/useDriver.ts` — single driver by id

- [ ] `'use client'`
- [ ] Accept `id: number | null`
- [ ] `useQuery({ queryKey: ['drivers', id], queryFn: () => getDriver(id!), enabled: !!id })`
- [ ] Return full `useQuery` result
- [ ] Export `useDriver`

#### 3c. `hooks/useDriverMutations.ts` — create / update / patch / delete

- [ ] `'use client'`
- [ ] Import `queryClient` from `@/lib/queryClient`
- [ ] Export `useCreateDriver()`:
  ```typescript
  useMutation({
    mutationFn: (data: DriverCreate) => createDriver(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); },
  })
  ```
- [ ] Export `useUpdateDriver()`:
  ```typescript
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: DriverCreate }) => updateDriver(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['drivers', id] });
    },
  })
  ```
- [ ] Export `usePatchDriver()`:
  ```typescript
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: DriverUpdate }) => patchDriver(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['drivers', id] });
    },
  })
  ```
- [ ] Export `useDeleteDriver()`:
  ```typescript
  useMutation({
    mutationFn: (id: number) => deleteDriver(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); },
  })
  ```

---

### 4. Helpers

#### 4a. `lib/licenseExpiry.ts` — expiry status helper

- [ ] Export `getLicenseExpiryStatus(dateStr: string): 'expired' | 'expiring' | 'ok'`:
  ```typescript
  export function getLicenseExpiryStatus(dateStr: string): 'expired' | 'expiring' | 'ok' {
    const expiry = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    if (expiry <= today) return 'expired';
    const diff = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 30) return 'expiring';
    return 'ok';
  }
  ```

---

### 5. Components

#### 5a. `components/drivers/DriverAvailabilityBadge.tsx`

- [ ] `'use client'`
- [ ] Import `Badge` from `@/components/ui/badge`
- [ ] Props: `interface DriverAvailabilityBadgeProps { isAvailable: boolean }`
- [ ] Render:
  - `isAvailable === true` → `<Badge variant="default" className="bg-green-500 text-white">Disponible</Badge>`
  - `isAvailable === false` → `<Badge variant="secondary">No disponible</Badge>`
- [ ] Export `DriverAvailabilityBadge`

#### 5b. `components/drivers/LicenseExpiryBadge.tsx`

- [ ] `'use client'`
- [ ] Import `Badge` from `@/components/ui/badge`
- [ ] Import `getLicenseExpiryStatus` from `@/lib/licenseExpiry`
- [ ] Props: `interface LicenseExpiryBadgeProps { dateStr: string }`
- [ ] Compute `status = getLicenseExpiryStatus(dateStr)`
- [ ] Render the date string + a badge when status is not `'ok'`:
  ```tsx
  <span className="flex items-center gap-2">
    <span>{dateStr}</span>
    {status === 'expired' && (
      <Badge variant="destructive">Vencida</Badge>
    )}
    {status === 'expiring' && (
      <Badge variant="outline" className="border-orange-400 text-orange-600">Por vencer</Badge>
    )}
  </span>
  ```
- [ ] Export `LicenseExpiryBadge`

#### 5c. `components/drivers/DriverTable.tsx` — TanStack Table

- [ ] `'use client'`
- [ ] Import `useReactTable`, `getCoreRowModel`, `flexRender`, `ColumnDef` from `@tanstack/react-table`
- [ ] Import shadcn Table primitives from `@/components/ui/table`
- [ ] Import `Button`, `Skeleton`, `DriverAvailabilityBadge`, `LicenseExpiryBadge`
- [ ] Import `Pencil`, `Trash2` from `lucide-react`
- [ ] Import `Driver` from `@/types/driver`
- [ ] Props:
  ```typescript
  interface DriverTableProps {
    data: Driver[];
    isLoading?: boolean;
    onEdit: (driver: Driver) => void;
    onDelete: (driver: Driver) => void;
  }
  ```
- [ ] Helper: `getFullName(driver: Driver): string` → `[first_name, last_name].filter(Boolean).join(' ') || username`
- [ ] Define columns `ColumnDef<Driver>[]`:
  - `full_name` — `getFullName(row.original)`, header "Conductor"
  - `license_number` — `row.original.license_number`, header "N° Licencia"
  - `license_expiry` — render `<LicenseExpiryBadge dateStr={row.original.license_expiry} />`, header "Vencimiento licencia"
  - `phone` — `row.original.phone`, header "Teléfono"
  - `is_available` — render `<DriverAvailabilityBadge isAvailable={row.original.is_available} />`, header "Disponibilidad"
  - `actions` — Edit + Delete icon buttons (same pattern as ProductTable)
- [ ] Loading: 5 skeleton rows × column count cells
- [ ] Empty: "No hay conductores registrados"
- [ ] Export `DriverTable`

#### 5d. `components/drivers/DriverForm.tsx` — create/edit form

- [ ] `'use client'`
- [ ] Import `useForm` from `react-hook-form`, `zodResolver` from `@hookform/resolvers/zod`, `z` from `zod`
- [ ] Import `Loader2` from `lucide-react`
- [ ] Import shadcn `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`
- [ ] Import `Input`, `Button`
- [ ] Import `DriverCreate` from `@/types/driver`
- [ ] Zod schema — **NO `.default()` or `.optional()`**:
  ```typescript
  const driverSchema = z.object({
    user: z.string().min(1, 'El ID de usuario es requerido').refine(
      (v) => Number.isInteger(Number(v)) && Number(v) > 0,
      'Debe ser un número entero positivo'
    ),
    license_number: z.string().min(1, 'El número de licencia es requerido'),
    license_expiry: z.string().min(1, 'La fecha de vencimiento es requerida'),
    phone: z.string().min(1, 'El teléfono es requerido'),
    is_available: z.boolean(),
  });
  type DriverFormValues = z.infer<typeof driverSchema>;
  ```
- [ ] Props:
  ```typescript
  interface DriverFormProps {
    defaultValues?: Partial<DriverCreate>;
    onSubmit: (data: DriverCreate) => Promise<void>;
    isSubmitting?: boolean;
  }
  ```
- [ ] `useForm<DriverFormValues>` with `zodResolver` and explicit `defaultValues`:
  ```typescript
  defaultValues: {
    user: defaultValues?.user != null ? String(defaultValues.user) : '',
    license_number: defaultValues?.license_number ?? '',
    license_expiry: defaultValues?.license_expiry ?? '',
    phone: defaultValues?.phone ?? '',
    is_available: defaultValues?.is_available ?? true,
  }
  ```
- [ ] `handleSubmit(values: DriverFormValues)` — convert fields:
  ```typescript
  const data: DriverCreate = {
    user: parseInt(values.user, 10),
    license_number: values.license_number.trim(),
    license_expiry: values.license_expiry,
    phone: values.phone.trim(),
    is_available: values.is_available,
  };
  await onSubmit(data);
  ```
- [ ] Fields layout:
  - `user` — Input `type="number"`, label "ID de usuario *", placeholder "ej. 3" — full width
  - Row: `license_number` Input (left), `license_expiry` Input `type="date"` (right) — labels "N° Licencia *", "Vencimiento licencia *"
  - `phone` — Input `type="tel"`, label "Teléfono *"
  - `is_available` — native checkbox + label "Disponible"
- [ ] Submit button: "Guardar" / "Guardando…" with Loader2 when submitting
- [ ] Export `DriverForm`

#### 5e. `components/drivers/DriverFilters.tsx` — filters bar

- [ ] `'use client'`
- [ ] Import `useState`, `useEffect`, `useRef` from `react`
- [ ] Import `Input`, `Button`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- [ ] Import `DriverListParams` from `@/types/driver`
- [ ] Props:
  ```typescript
  interface DriverFiltersProps {
    params: DriverListParams;
    onChange: (params: DriverListParams) => void;
  }
  ```
- [ ] Local state: `searchValue: string` — initialized from `params.search ?? ''`
- [ ] Sync via `useEffect` watching `params.search`
- [ ] Debounce `search` 300ms (`setTimeout` + `clearTimeout`) → `onChange({ ...params, search: value.trim() || undefined, page: 1 })`
- [ ] `is_available` select: values `'all'` / `'true'` / `'false'` → `onChange({ ...params, is_available: resolved, page: 1 })`
- [ ] Clear button: visible when `hasActiveFilters` (search or is_available defined) → `onChange({ page: 1 })`
- [ ] Render horizontal flex bar:
  - Search `Input` `className="w-full sm:w-64"` `placeholder="Buscar por licencia o teléfono…"`
  - Is-available `Select` `className="w-full sm:w-40"`: "Todos" / "Disponible" / "No disponible"
  - Clear `Button variant="outline"` — only when `hasActiveFilters`
- [ ] Export `DriverFilters`

---

### 6. Pages

#### 6a. `app/(app)/drivers/page.tsx` — list page

- [ ] `'use client'`
- [ ] State: `params: DriverListParams` (init `{ page: 1 }`), `isCreateOpen: boolean` (false), `driverToDelete: Driver | null` (null)
- [ ] `const PAGE_SIZE = 20`
- [ ] Fetch: `useDrivers(params)`, mutations: `useCreateDriver()`, `useDeleteDriver()`
- [ ] Handlers:
  - `handleEdit(driver)` → `router.push(`/drivers/${driver.id}`)`
  - `handleDeleteClick(driver)` → `setDriverToDelete(driver)`
  - `handleDeleteConfirm()` → `deleteMutation.mutateAsync(driverToDelete!.id)`, `setDriverToDelete(null)`, `toast.success('Conductor eliminado')`
  - `handleCreate(data)` → `createMutation.mutateAsync(data)`, `setIsCreateOpen(false)`, `toast.success('Conductor creado')`
- [ ] Render:
  - Header: "Conductores" h1 + "Nuevo conductor" Button
  - `DriverFilters`
  - Error state if `isError`
  - `DriverTable` with `data`, `isLoading`, `onEdit`, `onDelete`
  - Pagination row: page indicator + Anterior / Siguiente buttons (same pattern as products page)
  - Create `Dialog` with `DriverForm`
  - Delete confirm `Dialog`
- [ ] Export default `DriversPage`

#### 6b. `app/(app)/drivers/[id]/page.tsx` — detail + edit page

- [ ] `'use client'`
- [ ] Parse `id` from `useParams<{ id: string }>()`
- [ ] Fetch: `useDriver(id)`, mutations: `useUpdateDriver()`, `useDeleteDriver()`
- [ ] State: `isEditing: boolean`, `isDeleteOpen: boolean`
- [ ] Loading state: Skeleton blocks
- [ ] Error state: "Conductor no encontrado" + back link
- [ ] Read mode:
  - Header: "← Conductores" link + driver full name h1 + Edit + Delete buttons
  - `<Separator />`
  - `<dl>` grid 2-col:
    - Usuario: `user_detail.first_name + ' ' + user_detail.last_name` (fallback `user_detail.username`)
    - Username: `user_detail.username`
    - Email: `user_detail.email`
    - N° Licencia: `license_number`
    - Vencimiento: `<LicenseExpiryBadge dateStr={product.license_expiry} />`
    - Teléfono: `phone`
    - Disponibilidad: `<DriverAvailabilityBadge isAvailable={is_available} />`
    - Creado / Actualizado: formatted `toLocaleString()`
  - Delete confirm Dialog
- [ ] Edit mode: "Editar conductor" h1 + Cancel button + `DriverForm defaultValues={product} onSubmit={handleUpdate}`
- [ ] `handleUpdate` → `updateMutation.mutateAsync({ id, data })`, `setIsEditing(false)`, `toast.success('Conductor actualizado')`
- [ ] `handleDeleteConfirm` → `deleteMutation.mutateAsync(id)`, `router.push('/drivers')`, `toast.success('Conductor eliminado')`
- [ ] Export default `DriverDetailPage`

---

### 7. Integration Checks

- [ ] `types/driver.ts` exports: `UserDetail`, `Driver`, `DriverCreate`, `DriverUpdate`, `DriverListParams`
- [ ] `services/driverService.ts` uses only `apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete` — not raw axios
- [ ] All hooks import `queryClient` from `@/lib/queryClient` (singleton)
- [ ] Cache invalidation: create/delete → `['drivers']`; update/patch → `['drivers']` + `['drivers', id]`
- [ ] `DriverCreate` sent to API contains: `user` (number), `license_number`, `license_expiry`, `phone`, `is_available` — never `user_detail`
- [ ] `DriverForm` stores `user` as string in form state, converts to `parseInt` in `handleSubmit`
- [ ] `DriverForm` zod schema: NO `.default()`, NO `.optional()` — defaults in `useForm({ defaultValues })`
- [ ] `getLicenseExpiryStatus` compares dates with time component zeroed — avoids timezone-of-day edge cases
- [ ] `LicenseExpiryBadge` shows date string + warning badge; no badge when status is `'ok'`
- [ ] `DriverAvailabilityBadge` separate from `StatusBadge` — `is_available` field, different labels
- [ ] No new shadcn installs required
- [ ] TypeScript strict: no `any` types
- [ ] All new files are `'use client'`

---

## File Checklist

```
types/
└── driver.ts                          ← new

services/
└── driverService.ts                   ← new

hooks/
├── useDrivers.ts                      ← new
├── useDriver.ts                       ← new
└── useDriverMutations.ts              ← new

lib/
└── licenseExpiry.ts                   ← new

components/
└── drivers/
    ├── DriverAvailabilityBadge.tsx    ← new
    ├── LicenseExpiryBadge.tsx         ← new
    ├── DriverTable.tsx                ← new
    ├── DriverForm.tsx                 ← new
    └── DriverFilters.tsx              ← new

app/(app)/drivers/
├── page.tsx                           ← new
└── [id]/
    └── page.tsx                       ← new
```

**Files to modify**: none — sidebar already has `/drivers` link.

---

## Dependencies

- **Auth module**: complete
- **No other module FK** — Drivers has no FK to custom models (only `auth.User`)
- All installed packages already present: `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `zod`, shadcn components
