# Spec: Products Module

**Status**: 🔵 AWAITING APPROVAL
**Module**: products (module 4)
**Backend ref**: `docs/api-reference.md#products`
**Data models ref**: `docs/data-models.md#product`

---

## Scope

Build full CRUD for products, linked to Suppliers via an optional FK. Includes: TypeScript types (`Product`, `ProductCreate`, `ProductUpdate`, `ProductListParams`), service layer (6 functions), TanStack Query hooks (`useProducts`, `useProduct`, `useProductMutations` — 4 exports), a TanStack Table component with supplier name resolution (passed as `suppliersMap` prop from list page), a create/edit form with supplier Select dropdown, `unit_price` and `weight_kg` as decimal string fields, `sku` uniqueness validation handled server-side, `category` as free-form text input, a filters bar with search/category/supplier/is_active filters, a list page, and a detail/edit page.

Key differences from prior modules:
- `unit_price` and `weight_kg` arrive as decimal strings from Django — stored as `string` in TypeScript, displayed formatted, sent back as string from form.
- `supplier` is `number | null` in the model — form uses a Select with "None" option.
- Table supplier name resolution: the list page fetches all suppliers once (page 1, no is_active filter) and builds a `Record<number, string>` map — no N+1 queries.
- `sku` is unique server-side — a 400 error on duplicate must surface to the user.
- `category` is a free-form string — plain Input, no enum.

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
| `types/supplier.ts` | EXISTS — exports `Supplier`, `SupplierCreate`, `SupplierUpdate`, `SupplierListParams` |
| `services/supplierService.ts` | EXISTS — exports `listSuppliers` |
| `hooks/useSuppliers.ts` | EXISTS — exports `useSuppliers(params?)` |
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
All components needed for this module are already installed from prior modules:
`badge`, `dialog`, `select`, `skeleton`, `table`, `separator`, `sonner`, `button`, `input`, `label`, `form`

### New shadcn components needed
None. All required primitives are already present.

---

## Tasks

### 1. Types (`types/product.ts`)

- [ ] Define `Product` interface:
  ```typescript
  export interface Product {
    id: number;
    name: string;
    description: string | null;
    sku: string;
    category: string;
    unit_price: string;   // decimal string from Django (e.g. "12.50")
    weight_kg: string;    // decimal string from Django (e.g. "0.500")
    supplier: number | null;
    is_active: boolean;
    created_at: string;   // ISO 8601
    updated_at: string;   // ISO 8601
  }
  ```
- [ ] Define `ProductCreate` type:
  ```typescript
  export type ProductCreate = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
  // {
  //   name: string;
  //   description: string | null;
  //   sku: string;
  //   category: string;
  //   unit_price: string;
  //   weight_kg: string;
  //   supplier: number | null;
  //   is_active: boolean;
  // }
  ```
- [ ] Define `ProductUpdate` type:
  ```typescript
  export type ProductUpdate = Partial<ProductCreate>;
  ```
- [ ] Define `ProductListParams` interface:
  ```typescript
  export interface ProductListParams {
    page?: number;
    search?: string;      // name | sku
    category?: string;
    supplier?: number;    // filter by supplier id
    is_active?: boolean;
    ordering?: string;    // 'name' | 'unit_price' | '-created_at' | ...
  }
  ```
- [ ] Export all four from `types/product.ts`

---

### 2. Service (`services/productService.ts`)

All functions use helpers from `lib/api.ts`. No state, no side effects.

- [ ] Import `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete` from `@/lib/api`
- [ ] Import `Product`, `ProductCreate`, `ProductUpdate`, `ProductListParams` from `@/types/product`
- [ ] Import `PaginatedResponse` from `@/types/pagination`
- [ ] Export `listProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>>`
  - `apiGet<PaginatedResponse<Product>>('/products/', { params })`
- [ ] Export `getProduct(id: number): Promise<Product>`
  - `apiGet<Product>(`/products/${id}/`)`
- [ ] Export `createProduct(data: ProductCreate): Promise<Product>`
  - `apiPost<Product>('/products/', data)`
- [ ] Export `updateProduct(id: number, data: ProductCreate): Promise<Product>`
  - `apiPut<Product>(`/products/${id}/`, data)`
- [ ] Export `patchProduct(id: number, data: ProductUpdate): Promise<Product>`
  - `apiPatch<Product>(`/products/${id}/`, data)`
- [ ] Export `deleteProduct(id: number): Promise<void>`
  - `apiDelete<void>(`/products/${id}/`)`

---

### 3. Hooks

#### 3a. `hooks/useProducts.ts` — list with filters + pagination

- [ ] Mark `'use client'` at top
- [ ] Accept `params?: ProductListParams` argument
- [ ] Use `useQuery` from `@tanstack/react-query`:
  - `queryKey: ['products', params]`
  - `queryFn: () => listProducts(params)`
- [ ] Return full `useQuery` result object
- [ ] Export `useProducts` function

#### 3b. `hooks/useProduct.ts` — single product by id

- [ ] Mark `'use client'` at top
- [ ] Accept `id: number | null` argument
- [ ] Use `useQuery`:
  - `queryKey: ['products', id]`
  - `queryFn: () => getProduct(id!)`
  - `enabled: !!id`
- [ ] Return full `useQuery` result object
- [ ] Export `useProduct` function

#### 3c. `hooks/useProductMutations.ts` — create / update / patch / delete

- [ ] Mark `'use client'` at top
- [ ] Import `queryClient` from `@/lib/queryClient`
- [ ] Import service functions from `@/services/productService`
- [ ] Import `ProductCreate`, `ProductUpdate` from `@/types/product`
- [ ] Export `useCreateProduct()` hook:
  ```typescript
  useMutation({
    mutationFn: (data: ProductCreate) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  })
  ```
- [ ] Export `useUpdateProduct()` hook:
  ```typescript
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductCreate }) => updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  })
  ```
- [ ] Export `usePatchProduct()` hook:
  ```typescript
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdate }) => patchProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  })
  ```
- [ ] Export `useDeleteProduct()` hook:
  ```typescript
  useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  })
  ```

---

### 4. Components

#### 4a. `components/products/ProductTable.tsx` — TanStack Table

- [ ] Create `components/products/ProductTable.tsx` — `'use client'`
- [ ] Import `useReactTable`, `getCoreRowModel`, `flexRender`, `ColumnDef` from `@tanstack/react-table`
- [ ] Import shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@/components/ui/table`
- [ ] Import `Button` from `@/components/ui/button`
- [ ] Import `Skeleton` from `@/components/ui/skeleton`
- [ ] Import `StatusBadge` from `@/components/ui/StatusBadge`
- [ ] Import `Pencil`, `Trash2` from `lucide-react`
- [ ] Import `Product` from `@/types/product`
- [ ] Props:
  ```typescript
  interface ProductTableProps {
    data: Product[];
    isLoading?: boolean;
    suppliersMap: Record<number, string>; // id → name, built in list page
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
  }
  ```
- [ ] Define columns with `ColumnDef<Product>[]`:
  - `name` — `<span className="font-medium">{row.original.name}</span>`, header "Producto"
  - `sku` — `row.original.sku`, header "SKU"
  - `category` — `row.original.category`, header "Categoría"
  - `unit_price` — formatted as locale decimal (2 decimal places): `parseFloat(row.original.unit_price).toFixed(2)`, header "Precio unitario"
  - `weight_kg` — formatted as 3 decimal places: `parseFloat(row.original.weight_kg).toFixed(3)`, header "Peso (kg)"
  - `supplier` — resolve via `suppliersMap[row.original.supplier]` if `row.original.supplier !== null`, else `'—'`; header "Proveedor"
  - `is_active` — render `<StatusBadge isActive={row.original.is_active} />`, header "Estado"
  - `actions` — render icon buttons:
    - Edit: `variant="ghost"` size `"icon-sm"`, Pencil icon, `aria-label="Editar producto"`, calls `onEdit(row.original)`
    - Delete: `variant="ghost"` size `"icon-sm"`, Trash2 icon, `className="text-destructive hover:text-destructive"`, `aria-label="Eliminar producto"`, calls `onDelete(row.original)`
- [ ] When `isLoading` is true: render 5 skeleton rows × column count cells using `<Skeleton className="h-4 w-full" />`
- [ ] When data is empty and not loading: render `<TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">No hay productos registrados</TableCell></TableRow>`
- [ ] Export `ProductTable`

#### 4b. `components/products/ProductForm.tsx` — create/edit form

- [ ] Create `components/products/ProductForm.tsx` — `'use client'`
- [ ] Import `useForm` from `react-hook-form`
- [ ] Import `zodResolver` from `@hookform/resolvers/zod`
- [ ] Import `z` from `zod`
- [ ] Import `Loader2` from `lucide-react`
- [ ] Import shadcn `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` from `@/components/ui/form`
- [ ] Import `Input` from `@/components/ui/input`
- [ ] Import `Button` from `@/components/ui/button`
- [ ] Import `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `@/components/ui/select`
- [ ] Import `useSuppliers` from `@/hooks/useSuppliers`
- [ ] Import `ProductCreate` from `@/types/product`
- [ ] Props:
  ```typescript
  interface ProductFormProps {
    defaultValues?: Partial<ProductCreate>;
    onSubmit: (data: ProductCreate) => Promise<void>;
    isSubmitting?: boolean;
  }
  ```
- [ ] Fetch active suppliers inside the form for the dropdown:
  ```typescript
  const { data: suppliersData } = useSuppliers({ is_active: true, page: 1 });
  const suppliers = suppliersData?.results ?? [];
  ```
- [ ] Define zod schema — **NO `.default()` or `.optional()` per CLAUDE.md rule**:
  ```typescript
  const productSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string(),           // empty string → null in handleSubmit
    sku: z.string().min(1, 'El SKU es requerido'),
    category: z.string().min(1, 'La categoría es requerida'),
    unit_price: z.string().min(1, 'El precio es requerido'),    // kept as string
    weight_kg: z.string().min(1, 'El peso es requerido'),       // kept as string
    supplier: z.string(),              // "none" or string id → convert to number|null in handleSubmit
    is_active: z.boolean(),
  });
  ```
- [ ] `type ProductFormValues = z.infer<typeof productSchema>`
- [ ] Use `useForm<ProductFormValues>` with `zodResolver(productSchema)` and explicit `defaultValues`:
  ```typescript
  defaultValues: {
    name: defaultValues?.name ?? '',
    description: defaultValues?.description ?? '',
    sku: defaultValues?.sku ?? '',
    category: defaultValues?.category ?? '',
    unit_price: defaultValues?.unit_price ?? '',
    weight_kg: defaultValues?.weight_kg ?? '',
    supplier: defaultValues?.supplier != null ? String(defaultValues.supplier) : 'none',
    is_active: defaultValues?.is_active ?? true,
  }
  ```
- [ ] Implement `handleSubmit(values: ProductFormValues)` — convert fields before calling `onSubmit`:
  ```typescript
  const data: ProductCreate = {
    name: values.name,
    description: values.description.trim() === '' ? null : values.description.trim(),
    sku: values.sku.trim(),
    category: values.category.trim(),
    unit_price: values.unit_price.trim(),
    weight_kg: values.weight_kg.trim(),
    supplier: values.supplier === 'none' ? null : parseInt(values.supplier, 10),
    is_active: values.is_active,
  };
  await onSubmit(data);
  ```
- [ ] Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` for each field
- [ ] Fields layout (2-column grid on md+, 1-column on mobile):
  - Row 1: `name` Input (full width) — required, label "Nombre *"
  - Row 2: `sku` Input (left), `category` Input (right) — both required; labels "SKU *", "Categoría *"
  - Row 3: `unit_price` Input (left, type="text", placeholder "0.00"), `weight_kg` Input (right, type="text", placeholder "0.000") — both required; labels "Precio unitario *", "Peso (kg) *"
  - Row 4: `supplier` Select (left) — label "Proveedor"; options: value="none" label="Sin proveedor", then one SelectItem per supplier `value={String(s.id)} label={s.name}`; `description` Input (right) — optional, label "Descripción"
  - Row 5: `is_active` — native `<input type="checkbox" />` with label "Activo"
- [ ] Submit button: label "Guardar" normally; when `isSubmitting`: disabled + `<Loader2 className="animate-spin" />` + "Guardando…"
- [ ] Export `ProductForm`

> **Note on `supplier` field in form**: The form stores supplier as a string (`"none"` or `"42"`) to avoid controlled/uncontrolled issues with shadcn Select. Conversion to `number | null` happens exclusively in `handleSubmit`, not in the zod schema.

#### 4c. `components/products/ProductFilters.tsx` — filters bar

- [ ] Create `components/products/ProductFilters.tsx` — `'use client'`
- [ ] Import `useState`, `useEffect` from `react`
- [ ] Import `Input` from `@/components/ui/input`
- [ ] Import `Button` from `@/components/ui/button`
- [ ] Import `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `@/components/ui/select`
- [ ] Import `useSuppliers` from `@/hooks/useSuppliers`
- [ ] Import `ProductListParams` from `@/types/product`
- [ ] Props:
  ```typescript
  interface ProductFiltersProps {
    params: ProductListParams;
    onChange: (params: ProductListParams) => void;
  }
  ```
- [ ] Fetch suppliers for the dropdown (no is_active filter — show all suppliers as options):
  ```typescript
  const { data: suppliersData } = useSuppliers({ page: 1 });
  const suppliers = suppliersData?.results ?? [];
  ```
- [ ] Local state for debounced/blur-committed inputs:
  - `searchValue: string` — initialized from `params.search ?? ''`
  - `categoryValue: string` — initialized from `params.category ?? ''`
- [ ] Sync local state when `params` reset externally via `useEffect` watching `params.search`, `params.category`
- [ ] Debounce `search` — 300ms `setTimeout` before calling `onChange({ ...params, search: value.trim() || undefined, page: 1 })`; cleanup with `clearTimeout`
- [ ] `category` input: commit on blur (`handleCategoryBlur`) and on Enter keydown (`handleCategoryKeyDown`)
- [ ] Render a horizontal flex bar (`flex flex-wrap gap-2 items-center`) containing:
  - **Search input** (`Input`): `placeholder="Buscar por nombre o SKU…"`, `value={searchValue}`, `onChange` sets `searchValue`, debounced 300ms; `className="w-full sm:w-64"`
  - **Category input** (`Input`): `placeholder="Categoría"`, `value={categoryValue}`, `onChange` sets `categoryValue`, commit on blur/Enter; `className="w-full sm:w-40"`
  - **Supplier select** (`Select`): `value` = `params.supplier !== undefined ? String(params.supplier) : 'all'`, `onValueChange` maps `'all'` → `undefined`, else `parseInt(value)` → `onChange({ ...params, supplier: ..., page: 1 })`; options: `<SelectItem value="all">Todos los proveedores</SelectItem>` + one item per supplier `value={String(s.id)}`; `className="w-full sm:w-48"`
  - **Is active select** (`Select`): `value` = `params.is_active === true ? 'true' : params.is_active === false ? 'false' : 'all'`, options "Todos" / "Activo" / "Inactivo" → `onChange` immediately; `className="w-full sm:w-36"`
  - **Clear filters button** (`Button variant="outline"`): visible when `hasActiveFilters` — calls `onChange({ page: 1 })`
- [ ] Compute `hasActiveFilters`: true when any of `params.search`, `params.category`, `params.supplier`, `params.is_active` is defined
- [ ] Export `ProductFilters`

---

### 5. Pages

#### 5a. `app/(app)/products/page.tsx` — list page

- [ ] Create `app/(app)/products/page.tsx` — `'use client'`
- [ ] Import `useState` from `react`
- [ ] Import `useRouter` from `next/navigation`
- [ ] Import `toast` from `sonner`
- [ ] Import `useProducts` from `@/hooks/useProducts`
- [ ] Import `useSuppliers` from `@/hooks/useSuppliers`
- [ ] Import `useCreateProduct`, `useDeleteProduct` from `@/hooks/useProductMutations`
- [ ] Import `ProductTable` from `@/components/products/ProductTable`
- [ ] Import `ProductFilters` from `@/components/products/ProductFilters`
- [ ] Import `ProductForm` from `@/components/products/ProductForm`
- [ ] Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` from `@/components/ui/dialog`
- [ ] Import `Button` from `@/components/ui/button`
- [ ] Import `Product`, `ProductListParams` from `@/types/product`
- [ ] Local state:
  - `params: ProductListParams` — initialized to `{ page: 1 }`
  - `isCreateOpen: boolean` — initialized to `false`
  - `productToDelete: Product | null` — initialized to `null`
- [ ] Constant: `const PAGE_SIZE = 20`
- [ ] Fetch products: `const { data, isLoading, isError } = useProducts(params)`
- [ ] Fetch all suppliers for name resolution (no filters, all pages covered by mapping results of page 1 — acceptable for MVP since supplier count is expected to be small):
  ```typescript
  const { data: suppliersData } = useSuppliers({ page: 1 });
  ```
  Build the suppliersMap:
  ```typescript
  const suppliersMap: Record<number, string> = {};
  for (const s of suppliersData?.results ?? []) {
    suppliersMap[s.id] = s.name;
  }
  ```
- [ ] Mutation hooks:
  ```typescript
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();
  ```
- [ ] Handlers:
  - `handleEdit(product: Product)` → `router.push(`/products/${product.id}`)`
  - `handleDeleteClick(product: Product)` → `setProductToDelete(product)`
  - `handleDeleteConfirm()` → `await deleteMutation.mutateAsync(productToDelete!.id)`, `setProductToDelete(null)`, `toast.success('Producto eliminado')`
  - `handleCreate(data: ProductCreate)` → `await createMutation.mutateAsync(data)`, `setIsCreateOpen(false)`, `toast.success('Producto creado')`
- [ ] Render:
  ```
  <div className="space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Productos</h1>
      <Button onClick={() => setIsCreateOpen(true)}>Nuevo producto</Button>
    </div>

    {/* Filters */}
    <ProductFilters params={params} onChange={setParams} />

    {/* Error state */}
    {isError && <p className="text-destructive">Error al cargar productos</p>}

    {/* Table */}
    <ProductTable
      data={data?.results ?? []}
      isLoading={isLoading}
      suppliersMap={suppliersMap}
      onEdit={handleEdit}
      onDelete={handleDeleteClick}
    />

    {/* Pagination */}
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        Página {params.page ?? 1} de {Math.ceil((data?.count ?? 0) / PAGE_SIZE) || 1}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={(params.page ?? 1) <= 1}
          onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={data?.next === null}
          onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
        >
          Siguiente
        </Button>
      </div>
    </div>

    {/* Create Dialog */}
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
        </DialogHeader>
        <ProductForm
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={productToDelete !== null} onOpenChange={(open) => { if (!open) setProductToDelete(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar producto?</DialogTitle>
        </DialogHeader>
        <p>¿Estás seguro de que deseas eliminar <strong>{productToDelete?.name}</strong>? Esta acción no se puede deshacer.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setProductToDelete(null)}>Cancelar</Button>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={handleDeleteConfirm}
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
  ```
- [ ] Export default `ProductsPage`

#### 5b. `app/(app)/products/[id]/page.tsx` — detail + edit + delete page

- [ ] Create `app/(app)/products/[id]/page.tsx` — `'use client'`
- [ ] Import `useState` from `react`
- [ ] Import `useParams`, `useRouter` from `next/navigation`
- [ ] Import `toast` from `sonner`
- [ ] Import `useProduct` from `@/hooks/useProduct`
- [ ] Import `useSuppliers` from `@/hooks/useSuppliers`
- [ ] Import `useUpdateProduct`, `useDeleteProduct` from `@/hooks/useProductMutations`
- [ ] Import `ProductForm` from `@/components/products/ProductForm`
- [ ] Import `StatusBadge` from `@/components/ui/StatusBadge`
- [ ] Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` from `@/components/ui/dialog`
- [ ] Import `Button` from `@/components/ui/button`
- [ ] Import `Skeleton` from `@/components/ui/skeleton`
- [ ] Import `Separator` from `@/components/ui/separator`
- [ ] Read and parse params:
  ```typescript
  const { id: idParam } = useParams<{ id: string }>();
  const id = parseInt(idParam, 10);
  ```
- [ ] Fetch product: `const { data: product, isLoading, isError } = useProduct(id)`
- [ ] Fetch suppliers for name resolution in detail view:
  ```typescript
  const { data: suppliersData } = useSuppliers({ page: 1 });
  const suppliersMap: Record<number, string> = {};
  for (const s of suppliersData?.results ?? []) {
    suppliersMap[s.id] = s.name;
  }
  ```
- [ ] Mutation hooks:
  ```typescript
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  ```
- [ ] Local state:
  - `isEditing: boolean` — initialized to `false`
  - `isDeleteOpen: boolean` — initialized to `false`
- [ ] Handlers:
  - `handleUpdate(data: ProductCreate)` → `await updateMutation.mutateAsync({ id, data })`, `setIsEditing(false)`, `toast.success('Producto actualizado')`
  - `handleDeleteConfirm()` → `await deleteMutation.mutateAsync(id)`, `router.push('/products')`, `toast.success('Producto eliminado')`
- [ ] Render (loading state): show `<Skeleton>` blocks while `isLoading`
- [ ] Render (error state): if `isError` or `!product`, show "Producto no encontrado" message with back link `<Button variant="link" onClick={() => router.push('/products')}>← Volver a productos</Button>`
- [ ] Render (read mode — when `!isEditing`):
  ```
  <div className="space-y-6">
    {/* Breadcrumb / header */}
    <div className="flex items-center justify-between">
      <div>
        <Button variant="link" className="px-0" onClick={() => router.push('/products')}>
          ← Productos
        </Button>
        <h1 className="text-2xl font-bold">{product.name}</h1>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setIsEditing(true)}>Editar</Button>
        <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>Eliminar</Button>
      </div>
    </div>

    <Separator />

    {/* Detail fields grid */}
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><dt className="text-sm text-muted-foreground">SKU</dt><dd className="font-medium">{product.sku}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Categoría</dt><dd>{product.category}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Precio unitario</dt><dd>{parseFloat(product.unit_price).toFixed(2)}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Peso (kg)</dt><dd>{parseFloat(product.weight_kg).toFixed(3)}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Proveedor</dt><dd>{product.supplier !== null ? (suppliersMap[product.supplier] ?? `ID ${product.supplier}`) : '—'}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Estado</dt><dd><StatusBadge isActive={product.is_active} /></dd></div>
      <div className="col-span-full"><dt className="text-sm text-muted-foreground">Descripción</dt><dd>{product.description ?? '—'}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Creado</dt><dd className="text-sm">{new Date(product.created_at).toLocaleString()}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Actualizado</dt><dd className="text-sm">{new Date(product.updated_at).toLocaleString()}</dd></div>
    </dl>

    {/* Delete Dialog */}
    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>¿Eliminar producto?</DialogTitle></DialogHeader>
        <p>¿Estás seguro de que deseas eliminar <strong>{product.name}</strong>? Esta acción no se puede deshacer.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
          <Button variant="destructive" disabled={deleteMutation.isPending} onClick={handleDeleteConfirm}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
  ```
- [ ] Render (edit mode — when `isEditing`):
  ```
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Editar producto</h1>
      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
    </div>
    <ProductForm
      defaultValues={product}
      onSubmit={handleUpdate}
      isSubmitting={updateMutation.isPending}
    />
  </div>
  ```
- [ ] Export default `ProductDetailPage`

---

### 6. Sidebar Link

- [ ] Verify `/products` link exists in `app/(app)/layout.tsx` AppShell sidebar — add if missing:
  ```tsx
  <Link href="/products">Productos</Link>
  ```

---

### 7. Integration Checks

- [ ] `types/product.ts` exports: `Product`, `ProductCreate`, `ProductUpdate`, `ProductListParams`
- [ ] `services/productService.ts` uses `apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete` from `@/lib/api` (not raw axios)
- [ ] All hooks import `queryClient` from `@/lib/queryClient` (the exported singleton, not the provider)
- [ ] Cache invalidation: after create/update/patch/delete, `['products']` query is invalidated; after update/patch, `['products', id]` is also invalidated
- [ ] `ProductTable` accepts `suppliersMap: Record<number, string>` prop — resolves supplier id to name without extra API calls per row
- [ ] Supplier name fallback: if `suppliersMap[id]` is undefined (supplier not in page 1), display `"ID {id}"` — not a crash
- [ ] `ProductForm` supplier field stored as string (`"none"` or `"42"`) in form state — converted to `number | null` in `handleSubmit` only, not in zod schema
- [ ] `ProductForm` zod schema: NO `.default()`, NO `.optional()` on any field — defaults go in `useForm({ defaultValues: { ... } })`
- [ ] `ProductForm` `unit_price` and `weight_kg`: stored as plain strings throughout form — sent directly as string to API (Django accepts decimal string)
- [ ] `ProductForm` `description`: empty string `''` converted to `null` in `handleSubmit`; all other nullable handling is explicit in `handleSubmit` body
- [ ] `ProductFilters` supplier select: sends `undefined` (not empty string) to `params.supplier` when "Todos" is selected; sends parsed `number` otherwise
- [ ] `ProductFilters` category input: commits on blur and Enter keydown (same pattern as SupplierFilters city/country fields)
- [ ] Pagination: Prev disabled at `params.page === 1`; Next disabled when `data?.next === null`
- [ ] No new shadcn installs required — all components exist
- [ ] TypeScript strict: no `any` types in new files
- [ ] All new files are `'use client'` components — no server-component data fetching

---

## Decimal Display Helper Note

For display formatting, use inline `parseFloat(str).toFixed(N)` — no external formatting library needed. If a shared `formatCurrency` or `formatDecimal` utility exists in `lib/utils.ts`, prefer that; if not, inline is acceptable for this module.

---

## File Checklist (all files to create)

```
types/
└── product.ts                        ← new

services/
└── productService.ts                 ← new

hooks/
├── useProducts.ts                    ← new
├── useProduct.ts                     ← new
└── useProductMutations.ts            ← new

components/
└── products/
    ├── ProductTable.tsx              ← new
    ├── ProductForm.tsx               ← new
    └── ProductFilters.tsx            ← new

app/(app)/products/
├── page.tsx                          ← new
└── [id]/
    └── page.tsx                      ← new
```

**Files to modify:**
```
app/(app)/layout.tsx                  ← add /products sidebar link if missing
```

---

## Dependencies

- **Auth module**: complete
- **Suppliers module**: complete — `useSuppliers`, `listSuppliers`, `Supplier` type, `StatusBadge` all reused
- **Warehouses module**: complete (pattern reference)
- **Customers module**: complete (pattern reference)
- **TanStack React Query**: `@tanstack/react-query ^5` — installed
- **TanStack React Table**: `@tanstack/react-table ^8` — installed
- **React Hook Form**: `react-hook-form ^7` — installed
- **Zod**: `zod ^4` — installed
- **No new shadcn components to install**
