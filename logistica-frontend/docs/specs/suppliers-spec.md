# Spec: Suppliers Module

**Status**: VALIDATED ✓
**Module**: suppliers (module 1)
**Backend ref**: `docs/api-reference.md#suppliers`
**Data models ref**: `docs/data-models.md#supplier`

---

## Scope

Build full CRUD for supplier companies. Includes: TypeScript types, service layer, TanStack Query hooks (list with filters/pagination, single, mutations), a TanStack Table component, a form (create/edit via Dialog), a filters bar, a list page, and a detail/edit page. Depends on Auth module (complete).

---

## Infrastructure Audit (what NOT to create — already exists from Auth)

| File | Status |
|------|--------|
| `lib/api.ts` | EXISTS — exports `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete` |
| `lib/auth.ts` | EXISTS |
| `lib/queryClient.tsx` | EXISTS — exports `QueryProvider` and `queryClient` |
| `lib/utils.ts` | EXISTS — exports `cn` |
| `store/authStore.ts` | EXISTS |
| `components/ui/button.tsx` | EXISTS (base-ui Button + CVA) |
| `components/ui/input.tsx` | EXISTS (base-ui Input) |
| `components/ui/label.tsx` | EXISTS |
| `components/ui/form.tsx` | EXISTS (RHF FormProvider + FormField + FormItem + FormLabel + FormControl + FormMessage) |
| `app/(app)/layout.tsx` | EXISTS — auth guard + AppShell |

---

## shadcn/ui Components Audit

### Already installed (do NOT install again)
- `button` — `components/ui/button.tsx`
- `input` — `components/ui/input.tsx`
- `label` — `components/ui/label.tsx`
- `form` — `components/ui/form.tsx`

### Need to install (run `npx shadcn@latest add <name>` in project root)

- [x] **`badge`** — for `StatusBadge` (active/inactive) — `components/ui/badge.tsx`
- [x] **`dialog`** — for create/edit modal — `components/ui/dialog.tsx`
- [x] **`select`** — for is_active filter toggle (Select primitive) — `components/ui/select.tsx`
- [x] **`skeleton`** — for loading states — `components/ui/skeleton.tsx`
- [x] **`table`** — for base HTML table primitives — `components/ui/table.tsx`
- [x] **`separator`** — for visual dividers on detail page — `components/ui/separator.tsx`
- [x] **`sonner`** (toast) — for success/error notifications on mutations — `components/ui/sonner.tsx`

> Note: shadcn CLI will install these as components (not npm packages — they're copied source files). Run: `npx shadcn@latest add badge dialog select skeleton table separator sonner`
> After installing sonner also add `<Toaster />` to `app/layout.tsx`.

---

## Tasks

### 1. Types (`types/supplier.ts`)

- [x] Define `Supplier` interface:
  ```typescript
  interface Supplier {
    id: number;
    name: string;
    tax_id: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    city: string;
    country: string;
    is_active: boolean;
    created_at: string; // ISO 8601
    updated_at: string; // ISO 8601
  }
  ```
- [x] Define `SupplierCreate` type: `Omit<Supplier, 'id' | 'created_at' | 'updated_at'>`
- [x] Define `SupplierUpdate` type: `Partial<SupplierCreate>`
- [x] Define `SupplierListParams` interface for query params:
  ```typescript
  interface SupplierListParams {
    page?: number;
    search?: string;       // name | email | tax_id
    city?: string;
    country?: string;
    is_active?: boolean;
    ordering?: string;     // 'name' | '-created_at' | ...
  }
  ```
- [x] Export all four from `types/supplier.ts`

---

### 2. Service (`services/supplierService.ts`)

All functions use the helpers exported from `lib/api.ts` (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`). No state, no side effects.

- [x] Import `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete` from `@/lib/api`
- [x] Import `Supplier`, `SupplierCreate`, `SupplierUpdate`, `SupplierListParams` from `@/types/supplier`
- [x] Import `PaginatedResponse` — define locally or in a shared `types/pagination.ts`

  > Note: `PaginatedResponse<T>` is not yet in a shared file. Create `types/pagination.ts` with:
  > ```typescript
  > export interface PaginatedResponse<T> {
  >   count: number;
  >   next: string | null;
  >   previous: string | null;
  >   results: T[];
  > }
  > ```

- [x] Export `listSuppliers(params?: SupplierListParams): Promise<PaginatedResponse<Supplier>>`
  - `apiGet<PaginatedResponse<Supplier>>('/suppliers/', { params })`
- [x] Export `getSupplier(id: number): Promise<Supplier>`
  - `apiGet<Supplier>('/suppliers/${id}/')`
- [x] Export `createSupplier(data: SupplierCreate): Promise<Supplier>`
  - `apiPost<Supplier>('/suppliers/', data)`
- [x] Export `updateSupplier(id: number, data: SupplierCreate): Promise<Supplier>`
  - `apiPut<Supplier>('/suppliers/${id}/', data)`
- [x] Export `patchSupplier(id: number, data: SupplierUpdate): Promise<Supplier>`
  - `apiPatch<Supplier>('/suppliers/${id}/', data)`
- [x] Export `deleteSupplier(id: number): Promise<void>`
  - `apiDelete<void>('/suppliers/${id}/')`

---

### 3. Hooks

#### 3a. `hooks/useSuppliers.ts` — list with filters + pagination

- [x] Mark `'use client'` at top
- [x] Accept `params?: SupplierListParams` argument
- [x] Use `useQuery` from `@tanstack/react-query`:
  - `queryKey: ['suppliers', params]`
  - `queryFn: () => listSuppliers(params)`
- [x] Return `{ data, isLoading, isError, error, refetch }` from `useQuery`
- [x] Export `useSuppliers` function

#### 3b. `hooks/useSupplier.ts` — single supplier by id

- [x] Mark `'use client'` at top
- [x] Accept `id: number` argument
- [x] Use `useQuery`:
  - `queryKey: ['suppliers', id]`
  - `queryFn: () => getSupplier(id)`
  - `enabled: !!id`
- [x] Return `{ data, isLoading, isError, error }` from `useQuery`
- [x] Export `useSupplier` function

#### 3c. `hooks/useSupplierMutations.ts` — create / update / patch / delete

- [x] Mark `'use client'` at top
- [x] Import `queryClient` from `@/lib/queryClient`
- [x] Export `useCreateSupplier()` hook:
  - `useMutation({ mutationFn: createSupplier, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }) })`
  - Returns the mutation object (caller uses `.mutateAsync`)
- [x] Export `useUpdateSupplier()` hook:
  - `useMutation({ mutationFn: ({ id, data }: { id: number; data: SupplierCreate }) => updateSupplier(id, data), onSuccess: (_, { id }) => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); queryClient.invalidateQueries({ queryKey: ['suppliers', id] }); } })`
- [x] Export `usePatchSupplier()` hook:
  - Same pattern as update but calls `patchSupplier(id, data)` with `data: SupplierUpdate`
- [x] Export `useDeleteSupplier()` hook:
  - `useMutation({ mutationFn: (id: number) => deleteSupplier(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }) })`
- [x] On `onError` for all mutations: extract Axios error message and surface it (hook caller handles toast display)

---

### 4. Components

#### 4a. `components/ui/StatusBadge.tsx` — reusable active/inactive badge

> Check first: if any other module has created this component already, skip creation and import from the existing location.

- [x] Create `components/ui/StatusBadge.tsx`
- [x] Props: `{ isActive: boolean; activeLabel?: string; inactiveLabel?: string }`
- [x] Default labels: `activeLabel = 'Activo'`, `inactiveLabel = 'Inactivo'`
- [x] Use shadcn `Badge` component:
  - `isActive` → `variant="default"` (or custom green) + green text style
  - `!isActive` → `variant="secondary"` (or muted) + muted text style
- [x] Export `StatusBadge`

#### 4b. `components/suppliers/SupplierTable.tsx` — TanStack Table

- [x] Create `components/suppliers/SupplierTable.tsx` — `'use client'`
- [x] Import `useReactTable`, `getCoreRowModel`, `flexRender`, `ColumnDef` from `@tanstack/react-table`
- [x] Import shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@/components/ui/table`
- [x] Props:
  ```typescript
  interface SupplierTableProps {
    data: Supplier[];
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
    isLoading?: boolean;
  }
  ```
- [x] Define columns with `ColumnDef<Supplier>[]`:
  - `name` — display `supplier.name`, sortable label "Proveedor"
  - `tax_id` — display `supplier.tax_id ?? '—'`, label "RFC/Tax ID"
  - `email` — display `supplier.email`, label "Email"
  - `city` — display `supplier.city`, label "Ciudad"
  - `country` — display `supplier.country`, label "País"
  - `is_active` — render `<StatusBadge isActive={supplier.is_active} />`, label "Estado"
  - `actions` — render icon buttons: Edit (Pencil icon → calls `onEdit(row.original)`) and Delete (Trash icon → calls `onDelete(row.original)`)
    - Edit button: `variant="ghost"` size="icon-sm", `aria-label="Editar proveedor"`
    - Delete button: `variant="ghost"` size="icon-sm", destructive color, `aria-label="Eliminar proveedor"`
- [x] When `isLoading` is true: render skeleton rows (use `Skeleton` component, 5 rows × column count cells)
- [x] When data is empty and not loading: render a "No hay proveedores" empty state row spanning all columns
- [x] Export `SupplierTable`

#### 4c. `components/suppliers/SupplierForm.tsx` — create/edit form

- [x] Create `components/suppliers/SupplierForm.tsx` — `'use client'`
- [x] Props:
  ```typescript
  interface SupplierFormProps {
    defaultValues?: Partial<SupplierCreate>;
    onSubmit: (data: SupplierCreate) => Promise<void>;
    isSubmitting?: boolean;
  }
  ```
- [x] Define zod schema:
  ```typescript
  const supplierSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    tax_id: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v),
    email: z.string().email('Email inválido'),
    phone: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v),
    address: z.string().optional().or(z.literal('')).transform(v => v === '' ? null : v),
    city: z.string().min(1, 'La ciudad es requerida'),
    country: z.string().min(1, 'El país es requerido'),
    is_active: z.boolean().default(true),
  });
  ```
- [x] Use `useForm<z.infer<typeof supplierSchema>>` with `zodResolver(supplierSchema)` and `defaultValues`
- [x] Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` for each field
- [x] Fields layout (2-column grid on md+, 1-column on mobile):
  - Row 1: `name` (full width) — required
  - Row 2: `email` (left), `tax_id` (right)
  - Row 3: `phone` (left), `address` (right)
  - Row 4: `city` (left), `country` (right)
  - Row 5: `is_active` — rendered as a toggle/checkbox with label "Activo"
    - Use a native `<input type="checkbox">` styled with Tailwind, or a shadcn Switch if available
- [x] Submit button: label "Guardar" when not submitting, "Guardando…" with disabled state when `isSubmitting`
- [x] Export `SupplierForm`

#### 4d. `components/suppliers/SupplierFilters.tsx` — filters bar

- [x] Create `components/suppliers/SupplierFilters.tsx` — `'use client'`
- [x] Props:
  ```typescript
  interface SupplierFiltersProps {
    params: SupplierListParams;
    onChange: (params: SupplierListParams) => void;
  }
  ```
- [x] Render a horizontal flex bar (wraps on mobile) with:
  - **Search input**: `placeholder="Buscar por nombre, email, RFC…"` — debounced 300ms before calling `onChange({ ...params, search: value, page: 1 })`
  - **City input**: `placeholder="Ciudad"` — on blur/enter calls `onChange({ ...params, city: value, page: 1 })`
  - **Country input**: `placeholder="País"` — on blur/enter calls `onChange({ ...params, country: value, page: 1 })`
  - **Active status select**: shadcn `Select` with options: "Todos", "Activo", "Inactivo" — calls `onChange({ ...params, is_active: value, page: 1 })` where "Todos" = `undefined`
  - **Clear filters button**: visible when any filter is active — resets all params to `{ page: 1 }`
- [x] Use `Input` from `@/components/ui/input` for text fields
- [x] Use `Select` from `@/components/ui/select` for status filter
- [x] Export `SupplierFilters`

---

### 5. Pages

#### 5a. `app/(app)/suppliers/page.tsx` — list page

- [x] Create `app/(app)/suppliers/page.tsx` — `'use client'`
- [x] Local state: `params: SupplierListParams` initialized to `{ page: 1 }`
- [x] Fetch data: `const { data, isLoading, isError } = useSuppliers(params)`
- [x] Mutation hooks: `const createMutation = useCreateSupplier()`; `const deleteMutation = useDeleteSupplier()`
- [x] Dialog state: `isCreateOpen: boolean`, `supplierToDelete: Supplier | null`
- [x] Render:
  - Page header: title "Proveedores" + "Nuevo proveedor" Button (opens create Dialog)
  - `<SupplierFilters params={params} onChange={setParams} />`
  - `<SupplierTable data={data?.results ?? []} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDeleteClick} />`
  - Pagination: display "Página X de Y" + Prev/Next buttons (derived from `data.count`, 20 items/page)
  - Create Dialog: wraps `<SupplierForm>`, on submit calls `createMutation.mutateAsync(data)`, closes dialog on success, shows sonner toast "Proveedor creado"
  - Delete confirmation Dialog: "¿Eliminar proveedor X?" with Confirm/Cancel buttons, calls `deleteMutation.mutateAsync(id)` on confirm, shows sonner toast "Proveedor eliminado"
- [x] `handleEdit(supplier)` → navigate to `/suppliers/${supplier.id}` via `useRouter().push`
- [x] Error state: if `isError`, show error banner "Error al cargar proveedores"
- [x] Export default `SuppliersPage`

#### 5b. `app/(app)/suppliers/[id]/page.tsx` — detail + edit + delete page

- [x] Create `app/(app)/suppliers/[id]/page.tsx` — `'use client'`
- [x] Read `id` from `useParams()` and parse to number
- [x] Fetch: `const { data: supplier, isLoading, isError } = useSupplier(id)`
- [x] Mutation hooks: `const updateMutation = useUpdateSupplier()`; `const deleteMutation = useDeleteSupplier()`
- [x] Edit mode state: `isEditing: boolean`
- [x] Render (read mode):
  - Breadcrumb: "Proveedores / {supplier.name}" with back link to `/suppliers`
  - Detail card showing all fields: name, tax_id, email, phone, address, city, country, `<StatusBadge isActive={supplier.is_active} />`, created_at (formatted), updated_at (formatted)
  - Action buttons: "Editar" (sets `isEditing = true`) and "Eliminar" (opens delete confirm Dialog)
- [x] Render (edit mode):
  - Inline: replace detail card with `<SupplierForm defaultValues={supplier} onSubmit={handleUpdate} isSubmitting={updateMutation.isPending} />`
  - "Cancelar" button to exit edit mode
  - On submit: calls `updateMutation.mutateAsync({ id, data })`, exits edit mode on success, shows sonner toast "Proveedor actualizado"
- [x] Delete confirmation Dialog: "¿Eliminar proveedor {supplier.name}?" with Confirm/Cancel, on confirm calls `deleteMutation.mutateAsync(id)`, then `router.push('/suppliers')`, shows toast
- [x] Loading state: show `<Skeleton>` cards while `isLoading`
- [x] Error state: if `isError` or supplier not found, show "Proveedor no encontrado" with back link
- [x] Export default `SupplierDetailPage`

---

### 6. Integration Checks

- [x] `types/pagination.ts` created and `PaginatedResponse<T>` exported — imported by supplierService and future modules
- [x] `types/supplier.ts` exports: `Supplier`, `SupplierCreate`, `SupplierUpdate`, `SupplierListParams`
- [x] `services/supplierService.ts` uses `apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete` from `@/lib/api` (not raw axios)
- [x] All hooks import `queryClient` from `@/lib/queryClient` (the exported instance, not the provider)
- [x] Cache invalidation: after create/update/patch/delete, `['suppliers']` query is invalidated; after update/patch, `['suppliers', id]` is also invalidated
- [x] `SupplierTable` uses `@tanstack/react-table` (already in package.json — no install needed)
- [x] shadcn components (`badge`, `dialog`, `select`, `skeleton`, `table`, `separator`, `sonner`) are installed before implementing components that use them
- [x] After installing `sonner`: add `<Toaster />` from `sonner` to `app/layout.tsx` so toasts render globally
- [x] Sidebar already has `/suppliers` link — no sidebar changes needed
- [x] Root layout already wraps children in `<QueryProvider>` — no changes needed
- [x] `NEXT_PUBLIC_API_URL` environment variable must be set — confirm `.env.local` exists with correct value
- [x] `SupplierForm` nullable fields (`tax_id`, `phone`, `address`): zod transforms empty string `''` to `null` before sending to API
- [x] Pagination: `data.next` / `data.previous` URLs exist → derive current page from `params.page`; Prev disabled at page 1, Next disabled when `data.next === null`
- [x] Delete action on list page uses optimistic or pessimistic pattern — pessimistic is fine: await mutation, then invalidate
- [x] TypeScript strict: no `any` types anywhere in new files

---

## File Checklist (all files to create)

```
types/
├── pagination.ts              ← new (shared PaginatedResponse<T>)
└── supplier.ts                ← new

services/
└── supplierService.ts         ← new

hooks/
├── useSuppliers.ts            ← new
├── useSupplier.ts             ← new
└── useSupplierMutations.ts    ← new

components/
├── ui/
│   ├── StatusBadge.tsx        ← new (reusable across all modules)
│   ├── badge.tsx              ← install via shadcn CLI
│   ├── dialog.tsx             ← install via shadcn CLI
│   ├── select.tsx             ← install via shadcn CLI
│   ├── skeleton.tsx           ← install via shadcn CLI
│   ├── table.tsx              ← install via shadcn CLI
│   ├── separator.tsx          ← install via shadcn CLI
│   └── sonner.tsx             ← install via shadcn CLI
└── suppliers/
    ├── SupplierTable.tsx      ← new
    ├── SupplierForm.tsx       ← new
    └── SupplierFilters.tsx    ← new

app/(app)/suppliers/
├── page.tsx                   ← new
└── [id]/
    └── page.tsx               ← new
```

---

## Dependencies

- **Auth module**: complete (types, api, auth, queryClient, authStore, AppShell, auth guard all exist)
- **TanStack React Query**: `@tanstack/react-query ^5.100.14` — installed
- **TanStack React Table**: `@tanstack/react-table ^8.21.3` — installed
- **React Hook Form**: `react-hook-form ^7.76.1` — installed
- **Zod**: `zod ^4.4.3` — installed
- **shadcn components to add**: `badge dialog select skeleton table separator sonner`

---

## Validation Report

**Status**: NEEDS FIXES (2 issues found)

### Issues Found

1. **lib/queryClient.tsx:21** — bug: Two separate QueryClient instances created. Mutations import singleton from line 7, but QueryProvider creates new instance in useState. Cache invalidation will fail because `queryClient.invalidateQueries()` operates on wrong client. Fix: Use the exported singleton inside QueryProvider instead of creating new instance.

2. **components/suppliers/SupplierFilters.tsx:86** — nit: Placeholder text says "RUC" but spec (line 255) requires "RFC". Change placeholder to "Buscar por nombre, email, RFC…".

### Validation Details

- All 13 required files exist and are present
- TypeScript compilation passes (no errors)
- All imports are correct and paths resolve
- All shadcn components installed (badge, dialog, select, skeleton, table, separator, sonner)
- Toaster component added to app/layout.tsx (line 5, 34)
- All types properly defined (Supplier, SupplierCreate, SupplierUpdate, SupplierListParams, PaginatedResponse)
- All service functions use correct API helpers (apiGet, apiPost, apiPut, apiPatch, apiDelete)
- All hooks properly use useQuery and useMutation with correct queryKeys
- Components properly implement TanStack Table, RHF Form, and debouncing
- Pages properly implement pagination, dialogs, and mutations
- Button component supports icon-sm size variant
- Form null handling implemented via trim() in handleSubmit (pragmatic alternative to zod transforms)
- is_active default set to true
- Search debounce set to 300ms
- PAGE_SIZE constant set to 20 in list page
- All error states and loading states properly handled
- No `any` types in new files

### Files Status
- types/pagination.ts ✓
- types/supplier.ts ✓
- services/supplierService.ts ✓
- hooks/useSuppliers.ts ✓
- hooks/useSupplier.ts ✓
- hooks/useSupplierMutations.ts ✓
- components/ui/StatusBadge.tsx ✓
- components/suppliers/SupplierTable.tsx ✓
- components/suppliers/SupplierForm.tsx ✓
- components/suppliers/SupplierFilters.tsx ✓
- app/(app)/suppliers/page.tsx ✓
- app/(app)/suppliers/[id]/page.tsx ✓
- app/layout.tsx ✓

