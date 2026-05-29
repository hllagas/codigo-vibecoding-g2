# Spec: Routes Module

**Status**: 🔵 AWAITING APPROVAL
**Module**: routes (module 7)
**Backend ref**: `docs/api-reference.md#routes`
**Data models ref**: `docs/data-models.md#route`

---

## Scope

Build full CRUD for routes plus nested RouteStop management. Routes have FKs to Warehouse (`origin_warehouse`) and Transport (`transport`) — the API returns IDs only (no nested detail), so the list page builds `warehousesMap` and `transportsMap` (same pattern as `suppliersMap` in Products) from page-1 fetches. Status is a 4-value enum with a colored badge. The detail page renders a RouteStop sub-table (fetched from `/routes/{id}/stops/`) with inline add/edit/delete. Stop CRUD uses a separate service section with nested URL paths.

Key differences from prior modules:
- Two FK dropdowns in the route form: `origin_warehouse` (Warehouse) and `transport` (Transport).
- No nested detail objects in Route response — name resolution via maps built at list/detail page level.
- Nested resource: RouteStop CRUD at `/routes/{id}/stops/` and `/routes/{id}/stops/{stop_id}/`.
- `stop_order` must be unique per route — duplicate returns 400 `"Ya existe una parada con este orden en la ruta."`.
- `estimated_duration_hours` is a decimal string (same pattern as `capacity_kg`).
- `started_at` / `completed_at` / `estimated_arrival` / `actual_arrival` are optional ISO 8601 datetime strings — form uses `datetime-local` input, converts to ISO string or null.
- Status badge: planned=blue, in_progress=amber, completed=green, cancelled=red.

---

## Infrastructure Audit (what NOT to create — already exists)

| File | Status |
|------|--------|
| `lib/api.ts` | EXISTS |
| `lib/queryClient.tsx` | EXISTS — exports `queryClient` singleton |
| `types/pagination.ts` | EXISTS |
| `types/warehouse.ts` | EXISTS — exports `Warehouse` |
| `types/transport.ts` | EXISTS — exports `Transport` |
| `hooks/useWarehouses.ts` | EXISTS — reuse for dropdowns + map |
| `hooks/useTransports.ts` | EXISTS — reuse for dropdowns + map |
| `components/ui/*` | ALL EXIST (`button`, `input`, `form`, `badge`, `dialog`, `select`, `skeleton`, `table`, `separator`, `sonner`) |
| `components/ui/StatusBadge.tsx` | EXISTS |
| `app/(app)/layout.tsx` | EXISTS |
| `components/layout/Sidebar.tsx` | EXISTS — `/routes` link already present |

---

## shadcn/ui Components Audit

### Already installed — do NOT install again
All required: `badge`, `dialog`, `select`, `skeleton`, `table`, `separator`, `sonner`, `button`, `input`, `label`, `form`

### New shadcn components needed
None.

---

## Tasks

### 1. Types (`types/route.ts`)

- [ ] Define `RouteStatus` union:
  ```typescript
  export type RouteStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
  ```
- [ ] Define `RouteStop` interface:
  ```typescript
  export interface RouteStop {
    id: number;
    route: number;
    stop_order: number;
    address: string;
    city: string;
    latitude: string | null;
    longitude: string | null;
    estimated_arrival: string | null;  // ISO 8601
    actual_arrival: string | null;     // ISO 8601
  }
  ```
- [ ] Define `Route` interface:
  ```typescript
  export interface Route {
    id: number;
    name: string;
    origin_warehouse: number;
    transport: number;
    status: RouteStatus;
    estimated_duration_hours: string | null;  // decimal string
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  }
  ```
- [ ] Define `RouteCreate`:
  ```typescript
  export type RouteCreate = {
    name: string;
    origin_warehouse: number;
    transport: number;
    status: RouteStatus;
    estimated_duration_hours: string | null;
    started_at: string | null;
    completed_at: string | null;
  };
  ```
- [ ] Define `RouteUpdate`:
  ```typescript
  export type RouteUpdate = Partial<RouteCreate>;
  ```
- [ ] Define `RouteStopCreate`:
  ```typescript
  export type RouteStopCreate = {
    stop_order: number;
    address: string;
    city: string;
    latitude: string | null;
    longitude: string | null;
    estimated_arrival: string | null;
    actual_arrival: string | null;
  };
  ```
- [ ] Define `RouteStopUpdate`:
  ```typescript
  export type RouteStopUpdate = Partial<RouteStopCreate>;
  ```
- [ ] Define `RouteListParams`:
  ```typescript
  export interface RouteListParams {
    page?: number;
    search?: string;
    status?: RouteStatus;
    transport?: number;
    origin_warehouse?: number;
    ordering?: string;
  }
  ```
- [ ] Export all from `types/route.ts`

---

### 2. Service (`services/routeService.ts`)

**Route CRUD:**
- [ ] `listRoutes(params?: RouteListParams): Promise<PaginatedResponse<Route>>`
  - `apiGet('/routes/', { params })`
- [ ] `getRoute(id: number): Promise<Route>`
  - `apiGet(`/routes/${id}/`)`
- [ ] `createRoute(data: RouteCreate): Promise<Route>`
  - `apiPost('/routes/', data)`
- [ ] `updateRoute(id: number, data: RouteCreate): Promise<Route>`
  - `apiPut(`/routes/${id}/`, data)`
- [ ] `patchRoute(id: number, data: RouteUpdate): Promise<Route>`
  - `apiPatch(`/routes/${id}/`, data)`
- [ ] `deleteRoute(id: number): Promise<void>`
  - `apiDelete(`/routes/${id}/`)`

**RouteStop CRUD (nested under route):**
- [ ] `listRouteStops(routeId: number): Promise<RouteStop[]>`
  - `apiGet<RouteStop[]>(`/routes/${routeId}/stops/`)`
  - Note: stops list is NOT paginated — returns array directly
- [ ] `createRouteStop(routeId: number, data: RouteStopCreate): Promise<RouteStop>`
  - `apiPost(`/routes/${routeId}/stops/`, data)`
- [ ] `updateRouteStop(routeId: number, stopId: number, data: RouteStopCreate): Promise<RouteStop>`
  - `apiPut(`/routes/${routeId}/stops/${stopId}/`, data)`
- [ ] `patchRouteStop(routeId: number, stopId: number, data: RouteStopUpdate): Promise<RouteStop>`
  - `apiPatch(`/routes/${routeId}/stops/${stopId}/`, data)`
- [ ] `deleteRouteStop(routeId: number, stopId: number): Promise<void>`
  - `apiDelete(`/routes/${routeId}/stops/${stopId}/`)`

---

### 3. Hooks

#### 3a. `hooks/useRoutes.ts`
- [ ] `'use client'`
- [ ] `useQuery({ queryKey: ['routes', params], queryFn: () => listRoutes(params) })`
- [ ] Export `useRoutes(params?: RouteListParams)`

#### 3b. `hooks/useRoute.ts`
- [ ] `'use client'`
- [ ] `useQuery({ queryKey: ['routes', id], queryFn: () => getRoute(id!), enabled: !!id })`
- [ ] Export `useRoute(id: number | null)`

#### 3c. `hooks/useRouteMutations.ts`
- [ ] `'use client'`
- [ ] Import `queryClient` from `@/lib/queryClient`
- [ ] Export `useCreateRoute()`:
  ```typescript
  useMutation({
    mutationFn: (data: RouteCreate) => createRoute(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['routes'] }); },
  })
  ```
- [ ] Export `useUpdateRoute()`:
  ```typescript
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: RouteCreate }) => updateRoute(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['routes', id] });
    },
  })
  ```
- [ ] Export `usePatchRoute()`:
  ```typescript
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: RouteUpdate }) => patchRoute(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['routes', id] });
    },
  })
  ```
- [ ] Export `useDeleteRoute()`:
  ```typescript
  useMutation({
    mutationFn: (id: number) => deleteRoute(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['routes'] }); },
  })
  ```

#### 3d. `hooks/useRouteStops.ts`
- [ ] `'use client'`
- [ ] Accept `routeId: number | null`
- [ ] `useQuery({ queryKey: ['route-stops', routeId], queryFn: () => listRouteStops(routeId!), enabled: !!routeId })`
- [ ] Export `useRouteStops(routeId: number | null)`

#### 3e. `hooks/useRouteStopMutations.ts`
- [ ] `'use client'`
- [ ] Import `queryClient`
- [ ] Export `useCreateRouteStop(routeId: number)`:
  ```typescript
  useMutation({
    mutationFn: (data: RouteStopCreate) => createRouteStop(routeId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['route-stops', routeId] }); },
  })
  ```
- [ ] Export `useUpdateRouteStop(routeId: number)`:
  ```typescript
  useMutation({
    mutationFn: ({ stopId, data }: { stopId: number; data: RouteStopCreate }) =>
      updateRouteStop(routeId, stopId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['route-stops', routeId] }); },
  })
  ```
- [ ] Export `useDeleteRouteStop(routeId: number)`:
  ```typescript
  useMutation({
    mutationFn: (stopId: number) => deleteRouteStop(routeId, stopId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['route-stops', routeId] }); },
  })
  ```

---

### 4. Components

#### 4a. `components/routes/RouteStatusBadge.tsx`

- [ ] `'use client'`
- [ ] Import `Badge` from `@/components/ui/badge`
- [ ] Import `RouteStatus` from `@/types/route`
- [ ] Props: `{ status: RouteStatus }`
- [ ] Maps:
  ```typescript
  const LABELS: Record<RouteStatus, string> = {
    planned: 'Planificada',
    in_progress: 'En progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };
  const COLOR_MAP: Record<RouteStatus, string> = {
    planned: 'bg-blue-500 text-white',
    in_progress: 'bg-amber-500 text-white',
    completed: 'bg-green-500 text-white',
    cancelled: 'bg-red-500 text-white',
  };
  ```
- [ ] Render: `<Badge className={COLOR_MAP[status]}>{LABELS[status]}</Badge>`
- [ ] Export `RouteStatusBadge`

#### 4b. `components/routes/RouteTable.tsx`

- [ ] `'use client'`
- [ ] Props:
  ```typescript
  interface RouteTableProps {
    data: Route[];
    isLoading?: boolean;
    warehousesMap: Record<number, string>;
    transportsMap: Record<number, string>;
    onEdit: (route: Route) => void;
    onDelete: (route: Route) => void;
  }
  ```
- [ ] Columns `ColumnDef<Route>[]`:
  - `name` — `<span className="font-medium">{row.original.name}</span>`, header "Ruta"
  - `origin_warehouse` — `warehousesMap[row.original.origin_warehouse] ?? 'ID ' + row.original.origin_warehouse`, header "Almacén origen"
  - `transport` — `transportsMap[row.original.transport] ?? 'ID ' + row.original.transport`, header "Transporte"
  - `status` — `<RouteStatusBadge status={row.original.status} />`, header "Estado"
  - `estimated_duration_hours` — `row.original.estimated_duration_hours !== null ? parseFloat(row.original.estimated_duration_hours).toFixed(1) + ' h' : '—'`, header "Duración est."
  - `started_at` — `row.original.started_at ? new Date(row.original.started_at).toLocaleDateString() : '—'`, header "Inicio"
  - `actions` — Edit + Delete icon buttons (same pattern)
- [ ] Loading: 5 skeleton rows
- [ ] Empty: "No hay rutas registradas"
- [ ] Export `RouteTable`

#### 4c. `components/routes/RouteForm.tsx`

- [ ] `'use client'`
- [ ] Import `useWarehouses` from `@/hooks/useWarehouses`
- [ ] Import `useTransports` from `@/hooks/useTransports`
- [ ] Import `RouteCreate`, `RouteStatus` from `@/types/route`
- [ ] Zod schema — **NO `.default()` or `.optional()`**:
  ```typescript
  const routeSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    origin_warehouse: z.string().min(1, 'El almacén es requerido'),  // string id → parseInt
    transport: z.string().min(1, 'El transporte es requerido'),       // string id → parseInt
    status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
    estimated_duration_hours: z.string(),  // '' → null
    started_at: z.string(),               // '' → null, datetime-local → ISO string
    completed_at: z.string(),             // '' → null
  });
  type RouteFormValues = z.infer<typeof routeSchema>;
  ```
- [ ] Props:
  ```typescript
  interface RouteFormProps {
    defaultValues?: Partial<RouteCreate>;
    onSubmit: (data: RouteCreate) => Promise<void>;
    isSubmitting?: boolean;
  }
  ```
- [ ] Fetch dropdowns:
  ```typescript
  const { data: warehousesData } = useWarehouses({ is_active: true, page: 1 });
  const warehouses = warehousesData?.results ?? [];
  const { data: transportsData } = useTransports({ is_active: true, page: 1 });
  const transports = transportsData?.results ?? [];
  ```
- [ ] `useForm<RouteFormValues>` defaultValues:
  ```typescript
  {
    name: defaultValues?.name ?? '',
    origin_warehouse: defaultValues?.origin_warehouse != null ? String(defaultValues.origin_warehouse) : '',
    transport: defaultValues?.transport != null ? String(defaultValues.transport) : '',
    status: defaultValues?.status ?? 'planned',
    estimated_duration_hours: defaultValues?.estimated_duration_hours ?? '',
    started_at: defaultValues?.started_at
      ? defaultValues.started_at.slice(0, 16)  // convert ISO to datetime-local format
      : '',
    completed_at: defaultValues?.completed_at
      ? defaultValues.completed_at.slice(0, 16)
      : '',
  }
  ```
- [ ] `handleSubmit(values)` conversions:
  ```typescript
  const data: RouteCreate = {
    name: values.name.trim(),
    origin_warehouse: parseInt(values.origin_warehouse, 10),
    transport: parseInt(values.transport, 10),
    status: values.status as RouteStatus,
    estimated_duration_hours: values.estimated_duration_hours.trim() || null,
    started_at: values.started_at ? new Date(values.started_at).toISOString() : null,
    completed_at: values.completed_at ? new Date(values.completed_at).toISOString() : null,
  };
  await onSubmit(data);
  ```
- [ ] Fields layout:
  - `name` Input — full width, label "Nombre *"
  - Row: `origin_warehouse` Select (left), `transport` Select (right) — labels "Almacén origen *", "Transporte *"
    - warehouse options: one per active warehouse `value={String(w.id)}` label `w.name`
    - transport options: one per active transport `value={String(t.id)}` label `t.name`
  - Row: `status` Select (left), `estimated_duration_hours` Input type="text" placeholder="0.0" (right) — labels "Estado *", "Duración estimada (h)"
    - status options: planned/Planificada, in_progress/En progreso, completed/Completada, cancelled/Cancelada
  - Row: `started_at` Input type="datetime-local" (left), `completed_at` Input type="datetime-local" (right) — labels "Inicio", "Finalización"
- [ ] Submit button: "Guardar" / "Guardando…"
- [ ] Export `RouteForm`

#### 4d. `components/routes/RouteFilters.tsx`

- [ ] `'use client'`
- [ ] Import `useWarehouses` from `@/hooks/useWarehouses`
- [ ] Import `useTransports` from `@/hooks/useTransports`
- [ ] Import `RouteListParams`, `RouteStatus` from `@/types/route`
- [ ] Props: `{ params: RouteListParams; onChange: (params: RouteListParams) => void }`
- [ ] Local state: `searchValue: string`; debounce 300ms
- [ ] Fetch: `useWarehouses({ page: 1 })`, `useTransports({ page: 1 })`
- [ ] Status select: `'all'` + 4 statuses
- [ ] Transport select: `'all'` + transports from fetch
- [ ] Warehouse select: `'all'` + warehouses from fetch
- [ ] `hasActiveFilters`: any of search, status, transport, origin_warehouse defined
- [ ] Clear button → `onChange({ page: 1 })`
- [ ] Render horizontal flex bar:
  - Search Input `className="w-full sm:w-56"` `placeholder="Buscar por nombre…"`
  - Status Select `className="w-full sm:w-44"`: "Todos los estados" + 4 status options in Spanish
  - Warehouse Select `className="w-full sm:w-48"`: "Todos los almacenes"
  - Transport Select `className="w-full sm:w-48"`: "Todos los transportes"
  - Clear Button (visible when `hasActiveFilters`)
- [ ] Export `RouteFilters`

#### 4e. `components/routes/RouteStopTable.tsx`

- [ ] `'use client'`
- [ ] Import TanStack Table primitives, shadcn Table, `Button`, `Skeleton`, `Pencil`, `Trash2`
- [ ] Import `RouteStop` from `@/types/route`
- [ ] Props:
  ```typescript
  interface RouteStopTableProps {
    data: RouteStop[];
    isLoading?: boolean;
    onEdit: (stop: RouteStop) => void;
    onDelete: (stop: RouteStop) => void;
  }
  ```
- [ ] Columns `ColumnDef<RouteStop>[]`:
  - `stop_order` — `row.original.stop_order`, header "Orden"
  - `address` — `row.original.address`, header "Dirección"
  - `city` — `row.original.city`, header "Ciudad"
  - `estimated_arrival` — `row.original.estimated_arrival ? new Date(row.original.estimated_arrival).toLocaleString() : '—'`, header "Llegada estimada"
  - `actual_arrival` — `row.original.actual_arrival ? new Date(row.original.actual_arrival).toLocaleString() : '—'`, header "Llegada real"
  - `actions` — Edit + Delete icon buttons
- [ ] Sort rows by `stop_order` before passing to table: `[...data].sort((a, b) => a.stop_order - b.stop_order)`
- [ ] Loading: 3 skeleton rows
- [ ] Empty: "No hay paradas registradas"
- [ ] Export `RouteStopTable`

#### 4f. `components/routes/RouteStopForm.tsx`

- [ ] `'use client'`
- [ ] Import `useForm`, `zodResolver`, `z`, `Loader2`, `Form`, `FormField`, `Input`, `Button`
- [ ] Import `RouteStopCreate` from `@/types/route`
- [ ] Zod schema — **NO `.default()` or `.optional()`**:
  ```typescript
  const stopSchema = z.object({
    stop_order: z.string().min(1, 'El orden es requerido').refine(
      (v) => Number.isInteger(Number(v)) && Number(v) >= 1,
      'Debe ser un entero positivo'
    ),
    address: z.string().min(1, 'La dirección es requerida'),
    city: z.string().min(1, 'La ciudad es requerida'),
    latitude: z.string(),
    longitude: z.string(),
    estimated_arrival: z.string(),
    actual_arrival: z.string(),
  });
  type StopFormValues = z.infer<typeof stopSchema>;
  ```
- [ ] Props:
  ```typescript
  interface RouteStopFormProps {
    defaultValues?: Partial<RouteStopCreate>;
    onSubmit: (data: RouteStopCreate) => Promise<void>;
    isSubmitting?: boolean;
  }
  ```
- [ ] `useForm<StopFormValues>` defaultValues:
  ```typescript
  {
    stop_order: defaultValues?.stop_order != null ? String(defaultValues.stop_order) : '',
    address: defaultValues?.address ?? '',
    city: defaultValues?.city ?? '',
    latitude: defaultValues?.latitude ?? '',
    longitude: defaultValues?.longitude ?? '',
    estimated_arrival: defaultValues?.estimated_arrival
      ? defaultValues.estimated_arrival.slice(0, 16)
      : '',
    actual_arrival: defaultValues?.actual_arrival
      ? defaultValues.actual_arrival.slice(0, 16)
      : '',
  }
  ```
- [ ] `handleSubmit(values)` conversions:
  ```typescript
  const data: RouteStopCreate = {
    stop_order: parseInt(values.stop_order, 10),
    address: values.address.trim(),
    city: values.city.trim(),
    latitude: values.latitude.trim() || null,
    longitude: values.longitude.trim() || null,
    estimated_arrival: values.estimated_arrival
      ? new Date(values.estimated_arrival).toISOString()
      : null,
    actual_arrival: values.actual_arrival
      ? new Date(values.actual_arrival).toISOString()
      : null,
  };
  await onSubmit(data);
  ```
- [ ] Fields layout:
  - `stop_order` Input type="number" min="1" — label "Orden *"
  - Row: `address` Input (left full), `city` Input (right) — labels "Dirección *", "Ciudad *"
  - Row: `latitude` Input type="text" placeholder="-90 a 90" (left), `longitude` Input type="text" placeholder="-180 a 180" (right) — labels "Latitud", "Longitud"
  - Row: `estimated_arrival` Input type="datetime-local" (left), `actual_arrival` Input type="datetime-local" (right) — labels "Llegada estimada", "Llegada real"
- [ ] Submit button: "Guardar parada" / "Guardando…"
- [ ] Export `RouteStopForm`

---

### 5. Pages

#### 5a. `app/(app)/routes/page.tsx` — list page

- [ ] `'use client'`
- [ ] State: `params: RouteListParams` (init `{ page: 1 }`), `isCreateOpen: boolean`, `routeToDelete: Route | null`
- [ ] `const PAGE_SIZE = 20`
- [ ] Fetch: `useRoutes(params)`, `useWarehouses({ page: 1 })`, `useTransports({ page: 1 })`
- [ ] Build maps:
  ```typescript
  const warehousesMap: Record<number, string> = {};
  for (const w of warehousesData?.results ?? []) warehousesMap[w.id] = w.name;
  const transportsMap: Record<number, string> = {};
  for (const t of transportsData?.results ?? []) transportsMap[t.id] = t.name;
  ```
- [ ] Mutations: `useCreateRoute()`, `useDeleteRoute()`
- [ ] Handlers:
  - `handleEdit(route)` → `router.push(`/routes/${route.id}`)`
  - `handleDeleteClick(route)` → `setRouteToDelete(route)`
  - `handleDeleteConfirm()` → delete, clear, `toast.success('Ruta eliminada')`
  - `handleCreate(data)` → create, `setIsCreateOpen(false)`, `toast.success('Ruta creada')`
- [ ] Render: header + filters + error + table + pagination + Create Dialog + Delete confirm Dialog
- [ ] Export default `RoutesPage`

#### 5b. `app/(app)/routes/[id]/page.tsx` — detail + edit page

- [ ] `'use client'`
- [ ] Parse `id` from `useParams`
- [ ] Fetch: `useRoute(id)`, `useWarehouses({ page: 1 })`, `useTransports({ page: 1 })`, `useRouteStops(id)`
- [ ] Build maps same as list page
- [ ] Mutations: `useUpdateRoute()`, `useDeleteRoute()`, `useCreateRouteStop(id)`, `useUpdateRouteStop(id)`, `useDeleteRouteStop(id)`
- [ ] State:
  - `isEditing: boolean`
  - `isDeleteOpen: boolean`
  - `isStopFormOpen: boolean`
  - `editingStop: RouteStop | null`
  - `stopToDelete: RouteStop | null`
- [ ] Loading: Skeleton blocks
- [ ] Error: "Ruta no encontrada" + back link
- [ ] Read mode:
  - Header: "← Rutas" link + route name h1 + Edit + Delete buttons
  - `<Separator />`
  - `<dl>` grid 2-col: Nombre, Almacén origen (warehousesMap), Transporte (transportsMap), Estado (`<RouteStatusBadge />`), Duración estimada (formatted or '—'), Inicio (formatted or '—'), Finalización (formatted or '—'), Creado, Actualizado
  - Route Stops section:
    ```
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Paradas</h2>
        <Button size="sm" onClick={() => { setEditingStop(null); setIsStopFormOpen(true); }}>
          Añadir parada
        </Button>
      </div>
      <RouteStopTable
        data={stopsData ?? []}
        isLoading={stopsLoading}
        onEdit={(stop) => { setEditingStop(stop); setIsStopFormOpen(true); }}
        onDelete={(stop) => setStopToDelete(stop)}
      />
    </div>
    ```
  - Stop form Dialog (create/edit):
    ```
    <Dialog open={isStopFormOpen} onOpenChange={setIsStopFormOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingStop ? 'Editar parada' : 'Nueva parada'}</DialogTitle>
        </DialogHeader>
        <RouteStopForm
          defaultValues={editingStop ?? undefined}
          onSubmit={handleStopSubmit}
          isSubmitting={createStopMutation.isPending || updateStopMutation.isPending}
        />
      </DialogContent>
    </Dialog>
    ```
  - Stop delete confirm Dialog
  - Route delete confirm Dialog
- [ ] Edit mode: "Editar ruta" h1 + Cancel + `RouteForm defaultValues={route}`
- [ ] Handlers:
  - `handleUpdate(data)` → `updateMutation.mutateAsync({ id, data })`, `setIsEditing(false)`, toast
  - `handleDeleteConfirm()` → `deleteMutation.mutateAsync(id)`, `router.push('/routes')`, toast
  - `handleStopSubmit(data)`:
    ```typescript
    if (editingStop) {
      await updateStopMutation.mutateAsync({ stopId: editingStop.id, data });
      toast.success('Parada actualizada');
    } else {
      await createStopMutation.mutateAsync(data);
      toast.success('Parada añadida');
    }
    setIsStopFormOpen(false);
    setEditingStop(null);
    ```
  - `handleStopDeleteConfirm()` → `deleteStopMutation.mutateAsync(stopToDelete!.id)`, `setStopToDelete(null)`, toast
- [ ] Export default `RouteDetailPage`

---

### 6. Integration Checks

- [ ] `types/route.ts` exports all: `RouteStatus`, `Route`, `RouteCreate`, `RouteUpdate`, `RouteStop`, `RouteStopCreate`, `RouteStopUpdate`, `RouteListParams`
- [ ] `routeService.ts` uses `apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete` only
- [ ] `listRouteStops` returns `RouteStop[]` directly (not paginated)
- [ ] All hooks import `queryClient` singleton
- [ ] Route cache keys: `['routes']` and `['routes', id]`
- [ ] Stop cache key: `['route-stops', routeId]` — separate key namespace from routes
- [ ] Stop create/update/delete invalidates `['route-stops', routeId]` only
- [ ] Route update/delete also invalidates `['routes', id]`
- [ ] `RouteForm` stores `origin_warehouse` and `transport` as strings → `parseInt` in handleSubmit
- [ ] `RouteForm` `status` default `'planned'` set in `useForm({ defaultValues })` — NOT in zod schema
- [ ] `RouteForm` datetime fields: `slice(0, 16)` for input default, `new Date(...).toISOString()` for submit
- [ ] `RouteStopForm` `stop_order` stored as string → `parseInt` in handleSubmit
- [ ] `RouteStopForm` lat/lng: empty string → null in handleSubmit
- [ ] `RouteStopTable` rows sorted by `stop_order` client-side
- [ ] `warehousesMap` and `transportsMap` built at page level — no N+1 queries
- [ ] No new shadcn installs
- [ ] TypeScript strict: no `any`
- [ ] All new files `'use client'`

---

## File Checklist

```
types/
└── route.ts                              ← new

services/
└── routeService.ts                       ← new

hooks/
├── useRoutes.ts                          ← new
├── useRoute.ts                           ← new
├── useRouteMutations.ts                  ← new
├── useRouteStops.ts                      ← new
└── useRouteStopMutations.ts              ← new

components/
└── routes/
    ├── RouteStatusBadge.tsx              ← new
    ├── RouteTable.tsx                    ← new
    ├── RouteForm.tsx                     ← new
    ├── RouteFilters.tsx                  ← new
    ├── RouteStopTable.tsx                ← new
    └── RouteStopForm.tsx                 ← new

app/(app)/routes/
├── page.tsx                              ← new
└── [id]/
    └── page.tsx                          ← new
```

**Files to modify**: none — sidebar already has `/routes` link.

---

## Dependencies

- **Auth**: complete
- **Warehouses**: complete — `useWarehouses` reused for dropdown + map
- **Transports**: complete — `useTransports` reused for dropdown + map
- All packages installed
