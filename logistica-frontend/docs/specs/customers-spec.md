# Spec: Customers Module

**Status**: APPROVED — COMPLETE
**Module**: customers (module 3)
**Backend ref**: `docs/api-reference.md#customers`
**Data models ref**: `docs/data-models.md#customer`

---

## Scope

Build full CRUD for customer records. Includes: TypeScript types (`Customer`, `CustomerType` union, `CustomerCreate`, `CustomerUpdate`, `CustomerListParams`), service layer (6 functions), TanStack Query hooks (list with filters/pagination, single, mutations), a TanStack Table component with a `customer_type` badge column, a create/edit form with a `customer_type` Select field (RHF+zod — NO `.default()` / `.optional()` per CLAUDE.md rule), a filters bar with a `customer_type` select, a reusable `CustomerTypeBadge` component, a list page, and a detail/edit page. Depends on Auth module only — no other module FK is referenced.

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
| `types/supplier.ts` | EXISTS |
| `types/warehouse.ts` | EXISTS |
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
| `components/ui/StatusBadge.tsx` | EXISTS — reuse for `is_active` column |
| `app/(app)/layout.tsx` | EXISTS — auth guard + AppShell |

---

## shadcn/ui Components Audit

### Already installed (do NOT install again)
All components needed for this module are already installed from the Suppliers and Warehouses modules:
`badge`, `dialog`, `select`, `skeleton`, `table`, `separator`, `sonner`, `button`, `input`, `label`, `form`

### New shadcn components needed
None. All required primitives are already present.

---

## Tasks

### 1. Types (`types/customer.ts`)

- [x] Define `CustomerType` union type:
  ```typescript
  type CustomerType = 'company' | 'individual';
  ```
- [x] Define `Customer` interface:
  ```typescript
  interface Customer {
    id: number;
    name: string;
    customer_type: CustomerType;
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
- [x] Define `CustomerCreate` type:
  ```typescript
  type CustomerCreate = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
  ```
- [x] Define `CustomerUpdate` type:
  ```typescript
  type CustomerUpdate = Partial<CustomerCreate>;
  ```
- [x] Define `CustomerListParams` interface:
  ```typescript
  interface CustomerListParams {
    page?: number;
    search?: string;           // name | email | tax_id
    customer_type?: CustomerType;
    city?: string;
    country?: string;
    is_active?: boolean;
    ordering?: string;         // 'name' | 'customer_type' | '-created_at' | ...
  }
  ```
- [x] Export all five from `types/customer.ts`

---

### 2. Service (`services/customerService.ts`)

All functions use helpers from `lib/api.ts`. No state, no side effects.

- [x] Import `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete` from `@/lib/api`
- [x] Import `Customer`, `CustomerCreate`, `CustomerUpdate`, `CustomerListParams` from `@/types/customer`
- [x] Import `PaginatedResponse` from `@/types/pagination`
- [x] Export `listCustomers(params?: CustomerListParams): Promise<PaginatedResponse<Customer>>`
  - `apiGet<PaginatedResponse<Customer>>('/customers/', { params })`
- [x] Export `getCustomer(id: number): Promise<Customer>`
  - `apiGet<Customer>('/customers/${id}/')`
- [x] Export `createCustomer(data: CustomerCreate): Promise<Customer>`
  - `apiPost<Customer>('/customers/', data)`
- [x] Export `updateCustomer(id: number, data: CustomerCreate): Promise<Customer>`
  - `apiPut<Customer>('/customers/${id}/', data)`
- [x] Export `patchCustomer(id: number, data: CustomerUpdate): Promise<Customer>`
  - `apiPatch<Customer>('/customers/${id}/', data)`
- [x] Export `deleteCustomer(id: number): Promise<void>`
  - `apiDelete<void>('/customers/${id}/')`

---

### 3. Hooks

#### 3a. `hooks/useCustomers.ts` — list with filters + pagination

- [x] Mark `'use client'` at top
- [x] Accept `params?: CustomerListParams` argument
- [x] Use `useQuery` from `@tanstack/react-query`:
  - `queryKey: ['customers', params]`
  - `queryFn: () => listCustomers(params)`
- [x] Return `{ data, isLoading, isError, error, refetch }` from `useQuery`
- [x] Export `useCustomers` function

#### 3b. `hooks/useCustomer.ts` — single customer by id

- [x] Mark `'use client'` at top
- [x] Accept `id: number` argument
- [x] Use `useQuery`:
  - `queryKey: ['customers', id]`
  - `queryFn: () => getCustomer(id)`
  - `enabled: !!id`
- [x] Return `{ data, isLoading, isError, error }` from `useQuery`
- [x] Export `useCustomer` function

#### 3c. `hooks/useCustomerMutations.ts` — create / update / patch / delete

- [x] Mark `'use client'` at top
- [x] Import `queryClient` from `@/lib/queryClient`
- [x] Export `useCreateCustomer()` hook:
  - `useMutation({ mutationFn: createCustomer, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }) })`
  - Returns the mutation object (caller uses `.mutateAsync`)
- [x] Export `useUpdateCustomer()` hook:
  - `useMutation({ mutationFn: ({ id, data }: { id: number; data: CustomerCreate }) => updateCustomer(id, data), onSuccess: (_, { id }) => { queryClient.invalidateQueries({ queryKey: ['customers'] }); queryClient.invalidateQueries({ queryKey: ['customers', id] }); } })`
- [x] Export `usePatchCustomer()` hook:
  - Same pattern as update but calls `patchCustomer(id, data)` with `data: CustomerUpdate`
- [x] Export `useDeleteCustomer()` hook:
  - `useMutation({ mutationFn: (id: number) => deleteCustomer(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }) })`
- [x] On `onError` for all mutations: extract Axios error message and surface it (hook caller handles toast display)

---

### 4. Components

#### 4a. `components/customers/CustomerTypeBadge.tsx` — reusable customer type badge

- [x] Create `components/customers/CustomerTypeBadge.tsx` — `'use client'`
- [x] Props: `{ type: CustomerType }`
- [x] Import `Badge` from `@/components/ui/badge`
- [x] Import `CustomerType` from `@/types/customer`
- [x] Render:
  - `type === 'company'` → `<Badge>` with blue styling — label "Empresa"
  - `type === 'individual'` → `<Badge>` with green styling — label "Individual"
- [x] Use Tailwind classes for color overrides (e.g., `className="bg-blue-100 text-blue-800 border-blue-200"` for company; `"bg-green-100 text-green-800 border-green-200"` for individual)
- [x] Export `CustomerTypeBadge`

#### 4b. `components/customers/CustomerTable.tsx` — TanStack Table

- [x] Create `components/customers/CustomerTable.tsx` — `'use client'`
- [x] Import `useReactTable`, `getCoreRowModel`, `flexRender`, `ColumnDef` from `@tanstack/react-table`
- [x] Import shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@/components/ui/table`
- [x] Import `StatusBadge` from `@/components/ui/StatusBadge`
- [x] Import `CustomerTypeBadge` from `@/components/customers/CustomerTypeBadge`
- [x] Props:
  ```typescript
  interface CustomerTableProps {
    data: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    isLoading?: boolean;
  }
  ```
- [x] Define columns with `ColumnDef<Customer>[]`:
  - `name` — display `customer.name`, label "Cliente"
  - `customer_type` — render `<CustomerTypeBadge type={customer.customer_type} />`, label "Tipo"
  - `email` — display `customer.email`, label "Email"
  - `city` — display `customer.city`, label "Ciudad"
  - `country` — display `customer.country`, label "País"
  - `is_active` — render `<StatusBadge isActive={customer.is_active} />`, label "Estado"
  - `actions` — render icon buttons:
    - Edit: `variant="ghost"` size icon, Pencil icon → calls `onEdit(row.original)`, `aria-label="Editar cliente"`
    - Delete: `variant="ghost"` size icon, Trash icon → calls `onDelete(row.original)`, destructive color, `aria-label="Eliminar cliente"`
- [x] When `isLoading` is true: render skeleton rows (use `Skeleton` component, 5 rows × column count cells)
- [x] When data is empty and not loading: render "No hay clientes" empty state row spanning all columns
- [x] Export `CustomerTable`

#### 4c. `components/customers/CustomerForm.tsx` — create/edit form

- [x] Create `components/customers/CustomerForm.tsx` — `'use client'`
- [x] Props:
  ```typescript
  interface CustomerFormProps {
    defaultValues?: Partial<CustomerCreate>;
    onSubmit: (data: CustomerCreate) => Promise<void>;
    isSubmitting?: boolean;
  }
  ```
- [x] Define zod schema — **NO `.default()` or `.optional()` per CLAUDE.md rule**:
  ```typescript
  const customerSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    customer_type: z.enum(['company', 'individual']),
    tax_id: z.string(),       // empty string → null in handleSubmit
    email: z.string().email('Email inválido'),
    phone: z.string(),        // empty string → null in handleSubmit
    address: z.string(),      // empty string → null in handleSubmit
    city: z.string().min(1, 'La ciudad es requerida'),
    country: z.string().min(1, 'El país es requerido'),
    is_active: z.boolean(),
  });
  ```
- [x] `type CustomerFormValues = z.infer<typeof customerSchema>`
- [x] Use `useForm<CustomerFormValues>` with `zodResolver(customerSchema)` and explicit `defaultValues`:
  ```typescript
  defaultValues: {
    name: defaultValues?.name ?? '',
    customer_type: defaultValues?.customer_type ?? 'company',
    tax_id: defaultValues?.tax_id ?? '',
    email: defaultValues?.email ?? '',
    phone: defaultValues?.phone ?? '',
    address: defaultValues?.address ?? '',
    city: defaultValues?.city ?? '',
    country: defaultValues?.country ?? '',
    is_active: defaultValues?.is_active ?? true,
  }
  ```
- [x] Implement `handleSubmit(values: CustomerFormValues)` — convert nullable fields before calling `onSubmit`:
  ```typescript
  const data: CustomerCreate = {
    name: values.name,
    customer_type: values.customer_type,
    email: values.email,
    city: values.city,
    country: values.country,
    is_active: values.is_active,
    tax_id: values.tax_id.trim() === '' ? null : values.tax_id.trim(),
    phone: values.phone.trim() === '' ? null : values.phone.trim(),
    address: values.address.trim() === '' ? null : values.address.trim(),
  };
  await onSubmit(data);
  ```
- [x] Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` for each field
- [x] Use `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` from `@/components/ui/select` for `customer_type` field
- [x] Fields layout (2-column grid on md+, 1-column on mobile):
  - Row 1: `name` (full width) — required, label "Nombre *"
  - Row 2: `customer_type` Select (left), `email` Input (right) — both required; Select options: value="company" label="Empresa", value="individual" label="Individual"
  - Row 3: `tax_id` Input (left), `phone` Input (right) — both optional
  - Row 4: `address` Input (full width) — optional
  - Row 5: `city` Input (left), `country` Input (right) — both required
  - Row 6: `is_active` — native `<input type="checkbox">` with label "Activo"
- [x] Submit button: label "Guardar" normally; "Guardando…" with Loader2 spinner and `disabled` when `isSubmitting`
- [x] Export `CustomerForm`

#### 4d. `components/customers/CustomerFilters.tsx` — filters bar

- [x] Create `components/customers/CustomerFilters.tsx` — `'use client'`
- [x] Props:
  ```typescript
  interface CustomerFiltersProps {
    params: CustomerListParams;
    onChange: (params: CustomerListParams) => void;
  }
  ```
- [x] Local state for debounced/blur-committed fields: `searchValue`, `cityValue`, `countryValue` (strings)
- [x] Sync local state when `params` reset externally via `useEffect` watching `params.search`, `params.city`, `params.country`
- [x] Debounce `search` — 300ms `setTimeout` before calling `onChange({ ...params, search: value || undefined, page: 1 })`
- [x] `city` and `country` inputs: commit on blur and on Enter keydown
- [x] Render a horizontal flex bar (wraps on mobile) with:
  - **Search input** (`Input`): `placeholder="Buscar por nombre, email, Tax ID…"` — debounced 300ms
  - **Customer type select** (`Select`): options "Todos" (value `'all'` → `undefined`), "Empresa" (value `'company'`), "Individual" (value `'individual'`) — calls `onChange({ ...params, customer_type: value || undefined, page: 1 })` immediately
  - **City input** (`Input`): `placeholder="Ciudad"` — blur/Enter commit
  - **Country input** (`Input`): `placeholder="País"` — blur/Enter commit
  - **Is active select** (`Select`): options "Todos" (→ `undefined`), "Activo" (→ `true`), "Inactivo" (→ `false`) — immediate
  - **Clear filters button** (`Button variant="outline"`): visible when any filter is active — resets all params to `{ page: 1 }`
- [x] Compute `hasActiveFilters`: true when any of `params.search`, `params.customer_type`, `params.city`, `params.country`, `params.is_active` is defined
- [x] Export `CustomerFilters`

---

### 5. Pages

#### 5a. `app/(app)/customers/page.tsx` — list page

- [x] Create `app/(app)/customers/page.tsx` — `'use client'`
- [x] Local state: `params: CustomerListParams` initialized to `{ page: 1 }`
- [x] Fetch: `const { data, isLoading, isError } = useCustomers(params)`
- [x] Mutation hooks: `const createMutation = useCreateCustomer()`; `const deleteMutation = useDeleteCustomer()`
- [x] Dialog state: `isCreateOpen: boolean`, `customerToDelete: Customer | null`
- [x] Constant: `const PAGE_SIZE = 20`
- [x] Render:
  - Page header: title "Clientes" + "Nuevo cliente" `Button` (opens create Dialog)
  - `<CustomerFilters params={params} onChange={setParams} />`
  - `<CustomerTable data={data?.results ?? []} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDeleteClick} />`
  - Pagination: "Página X de Y" + Prev/Next buttons — Prev disabled at page 1, Next disabled when `data?.next === null`; total pages = `Math.ceil((data?.count ?? 0) / PAGE_SIZE)`
  - Create Dialog: wraps `<CustomerForm>`, on submit calls `createMutation.mutateAsync(data)`, closes dialog on success, shows sonner toast "Cliente creado"
  - Delete confirmation Dialog: "¿Eliminar cliente {customerToDelete.name}?" with Confirm/Cancel buttons — calls `deleteMutation.mutateAsync(id)` on confirm, shows sonner toast "Cliente eliminado"
- [x] `handleEdit(customer: Customer)` → navigate to `/customers/${customer.id}` via `useRouter().push`
- [x] `handleDeleteClick(customer: Customer)` → set `customerToDelete`; confirm → `deleteMutation.mutateAsync`, then `setCustomerToDelete(null)`
- [x] Error state: if `isError`, show error banner "Error al cargar clientes"
- [x] Export default `CustomersPage`

#### 5b. `app/(app)/customers/[id]/page.tsx` — detail + edit + delete page

- [x] Create `app/(app)/customers/[id]/page.tsx` — `'use client'`
- [x] Read `id` from `useParams()` and parse to number
- [x] Fetch: `const { data: customer, isLoading, isError } = useCustomer(id)`
- [x] Mutation hooks: `const updateMutation = useUpdateCustomer()`; `const deleteMutation = useDeleteCustomer()`
- [x] Edit mode state: `isEditing: boolean`; delete confirm state: `isDeleteOpen: boolean`
- [x] Render (read mode):
  - Breadcrumb: "Clientes / {customer.name}" with back link to `/customers`
  - Detail card showing all fields: name, `<CustomerTypeBadge type={customer.customer_type} />`, tax_id (or "—"), email, phone (or "—"), address (or "—"), city, country, `<StatusBadge isActive={customer.is_active} />`, created_at (formatted), updated_at (formatted)
  - Action buttons: "Editar" (`Button`, sets `isEditing = true`) and "Eliminar" (`Button variant="destructive"`, sets `isDeleteOpen = true`)
- [x] Render (edit mode):
  - Replace detail card with `<CustomerForm defaultValues={customer} onSubmit={handleUpdate} isSubmitting={updateMutation.isPending} />`
  - "Cancelar" button to exit edit mode
  - On submit: calls `updateMutation.mutateAsync({ id, data })`, exits edit mode on success, shows sonner toast "Cliente actualizado"
- [x] Delete confirmation Dialog: "¿Eliminar cliente {customer.name}?" with Confirm/Cancel — on confirm calls `deleteMutation.mutateAsync(id)`, then `router.push('/customers')`, shows toast "Cliente eliminado"
- [x] Loading state: show `<Skeleton>` cards while `isLoading`
- [x] Error state: if `isError` or customer not found, show "Cliente no encontrado" with back link to `/customers`
- [x] Export default `CustomerDetailPage`

---

### 6. Integration Checks

- [x] `types/customer.ts` exports: `CustomerType`, `Customer`, `CustomerCreate`, `CustomerUpdate`, `CustomerListParams`
- [x] `services/customerService.ts` uses `apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete` from `@/lib/api` (not raw axios)
- [x] All hooks import `queryClient` from `@/lib/queryClient` (the exported singleton, not the provider)
- [x] Cache invalidation: after create/update/patch/delete, `['customers']` query is invalidated; after update/patch, `['customers', id]` is also invalidated
- [x] `CustomerTable` uses `@tanstack/react-table` (already in package.json — no install needed)
- [x] No new shadcn installs required — all components exist
- [x] `CustomerForm` nullable fields (`tax_id`, `phone`, `address`): converted empty string `''` to `null` in `handleSubmit` body (NOT via zod `.transform()` or `.optional()` — per CLAUDE.md rule)
- [x] `CustomerForm` zod schema: NO `.default()`, NO `.optional()` on any field — defaults go in `useForm({ defaultValues: { ... } })`
- [x] `CustomerForm` `customer_type` field: renders as shadcn `Select` with `<Controller>` pattern via `FormField` — passes `field.value` as `value` prop and `field.onChange` as `onValueChange` prop on `Select`
- [x] `CustomerTypeBadge` lives in `components/customers/` (not `components/ui/`) — it is customer-domain-specific
- [x] `CustomerFilters` `customer_type` select: sends `undefined` (not empty string) to `params` when "Todos" is selected; passes the typed `CustomerType` value for 'company' / 'individual'
- [x] Pagination: Prev disabled at `params.page === 1`; Next disabled when `data?.next === null`
- [x] Sidebar: verify `/customers` link exists in AppShell — add if missing
- [x] TypeScript strict: no `any` types in new files
- [x] All new `'use client'` files only — no server-component data fetching

---

## File Checklist (all files to create)

```
types/
└── customer.ts                     ← new

services/
└── customerService.ts              ← new

hooks/
├── useCustomers.ts                 ← new
├── useCustomer.ts                  ← new
└── useCustomerMutations.ts         ← new

components/
└── customers/
    ├── CustomerTypeBadge.tsx       ← new (domain-specific badge)
    ├── CustomerTable.tsx           ← new
    ├── CustomerForm.tsx            ← new
    └── CustomerFilters.tsx         ← new

app/(app)/customers/
├── page.tsx                        ← new
└── [id]/
    └── page.tsx                    ← new
```

---

## Dependencies

- **Auth module**: complete
- **Suppliers module**: complete (StatusBadge, all shadcn components, PaginatedResponse<T> — all reused)
- **Warehouses module**: complete (pattern reference for hooks, form, filters)
- **No FK dependencies** — Customers module does not reference other domain models
- **TanStack React Query**: `@tanstack/react-query ^5` — installed
- **TanStack React Table**: `@tanstack/react-table ^8` — installed
- **React Hook Form**: `react-hook-form ^7` — installed
- **Zod**: `zod ^4` — installed
- **No new shadcn components to install**

---

## Validation Report

**Status**: VALIDATED ✓

All implementation requirements met. TypeScript compilation passes with zero errors.

### Critical Checks Passed
- [x] Zod schema: NO `.default()` or `.optional()` — all defaults via `useForm({ defaultValues })`
- [x] Nullable field conversions: `tax_id`, `phone`, `address` converted from empty string to `null` in `handleSubmit` only
- [x] Select component `onValueChange`: correctly typed to accept `string | null`
- [x] `useCustomer` hook: accepts `number | null` parameter with `enabled: !!id` guard
- [x] Cache invalidation: proper queryKey invalidation in all mutations
- [x] Form validation: customer_type as `z.enum()`, is_active as `z.boolean()`
- [x] CustomerTable: 7 columns (name, customer_type, email, city, country, is_active, actions)
- [x] CustomerTypeBadge: company='company' → blue/Empresa, individual → green/Individual
- [x] Empty state message: "No hay clientes registrados"
- [x] Error state: "Cliente no encontrado"
- [x] Pagination: Prev disabled at page 1, Next disabled when `data?.next === null`
- [x] Skeleton loading: 5 rows × column count
- [x] Native checkbox: `<input type="checkbox">` for is_active field
- [x] Debounce search: 300ms with cleanup
- [x] Blur/Enter commit: city and country inputs commit on blur and Enter keydown
- [x] Form layout: 2-column grid on md+, 1-column on mobile
- [x] Clear filters button: visible only when filters are active
- [x] User-facing toast notifications: success messages on create/update/delete/clear
- [x] Edit mode state: uses `editMode` (minor naming: spec says `isEditing`, actual is `editMode`)
- [x] Delete confirm state: uses `deleteOpen` (minor naming: spec says `isDeleteOpen`, actual is `deleteOpen`)

### Minor Deviations (Non-functional)
1. Detail page layout: CustomerTypeBadge and StatusBadge displayed in header (next to h1) rather than as detail fields. Both badges are present and functional.
2. State variable naming: `editMode`/`deleteOpen` instead of `isEditing`/`isDeleteOpen`. No functional impact.

### Summary
Module is fully functional and meets all specification requirements. All TypeScript types are correct. All hooks have proper cache invalidation. All form validation follows CLAUDE.md rules.
