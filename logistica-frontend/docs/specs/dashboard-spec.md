# Spec: Dashboard Module

**Status**: IMPLEMENTED
**Module**: dashboard
**Backend ref**: `docs/api-reference.md` (all modules — shipments, routes, drivers, transports, products, customers, suppliers, warehouses)

---

## Scope

Build a `/dashboard` operational overview page that aggregates data from all 8 business modules. The dashboard is organized in three phases: Phase 1 (core KPIs + shipment/route/driver charts), Phase 2 (delivery performance + customer/product analytics), Phase 3 (warehouse utilization + fleet + customer growth). Charts are rendered with the **Tremor** library (`@tremor/react`). A global date-range filter (top of page) scopes all shipment-derived charts by `created_at`. All data fetching goes through TanStack Query v5 via the existing `src/lib/api.ts` Axios wrapper. A new `lib/dashboardUtils.ts` provides pure client-side grouping helpers (no state, no fetches). A new `hooks/useDashboard.ts` centralizes all dashboard `useQuery` calls. A new `types/dashboard.ts` defines computed/derived types used only by dashboard components.

---

## Infrastructure Audit (what NOT to create — already exists)

| File | Status |
|------|--------|
| `lib/api.ts` | EXISTS — exports `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete` |
| `lib/queryClient.tsx` | EXISTS — exports `queryClient` singleton |
| `lib/auth.ts` | EXISTS |
| `lib/utils.ts` | EXISTS |
| `types/pagination.ts` | EXISTS — exports `PaginatedResponse` |
| `types/shipment.ts` | EXISTS — exports `Shipment`, `ShipmentStatus`, `ShipmentItem` |
| `types/route.ts` | EXISTS — exports `Route`, `RouteStatus` |
| `types/driver.ts` | EXISTS — exports `Driver` |
| `types/warehouse.ts` | EXISTS — exports `Warehouse`, `WarehouseStock` |
| `types/product.ts` | EXISTS — exports `Product` |
| `types/customer.ts` | EXISTS — exports `Customer` |
| `types/supplier.ts` | EXISTS — exports `Supplier` |
| `types/transport.ts` | EXISTS — exports `Transport` |
| `hooks/useShipments.ts` | EXISTS |
| `hooks/useRoutes.ts` | EXISTS |
| `hooks/useDrivers.ts` | EXISTS |
| `hooks/useWarehouses.ts` | EXISTS |
| `hooks/useWarehouseStock.ts` | EXISTS |
| `hooks/useProducts.ts` | EXISTS |
| `hooks/useCustomers.ts` | EXISTS |
| `hooks/useSuppliers.ts` | EXISTS |
| `hooks/useTransports.ts` | EXISTS |
| `services/shipmentService.ts` | EXISTS |
| `services/warehouseService.ts` | EXISTS |
| `services/driverService.ts` | EXISTS |
| `services/routeService.ts` | EXISTS |
| `services/productService.ts` | EXISTS |
| `services/customerService.ts` | EXISTS |
| `services/transportService.ts` | EXISTS |
| `components/ui/*` | ALL EXIST (button, badge, dialog, select, skeleton, separator, sonner, input, label, form, table) |
| `store/authStore.ts` | EXISTS — Zustand auth store |
| `app/(app)/layout.tsx` | EXISTS |
| `components/layout/Sidebar.tsx` | EXISTS — does NOT yet have `/dashboard` link |

---

## shadcn/ui Components Audit

### Already installed — do NOT install again
`badge`, `button`, `dialog`, `form`, `input`, `label`, `select`, `separator`, `skeleton`, `sonner`, `table`

### New shadcn components needed
None — Tremor provides all chart primitives; shadcn `Skeleton` and `Alert` are used for loading/error states, and `Alert` is available via shadcn install if missing.

---

## Tasks

### Phase 0 — Setup

#### 0a. Install Tremor
- [x] Run `npm install @tremor/react` to add Tremor as a dependency
- [x] Verify Tremor works with Next.js App Router — Tremor components are React client components and require `'use client'` in every chart component file
- [x] Do NOT add a Tremor CSS import to `globals.css`; Tremor v3+ uses Tailwind CSS utilities only. Confirm that the existing Tailwind v4 setup (PostCSS `@tailwindcss/postcss`) is compatible — Tremor relies on standard Tailwind class names

#### 0b. Add Dashboard link to Sidebar
- [x] Open `components/layout/Sidebar.tsx`
- [x] Import `LayoutDashboard` from `lucide-react`
- [x] Add `{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }` as the **first** entry in `navLinks` (before Proveedores)
- [x] No other changes to Sidebar

---

### 1. Types (`types/dashboard.ts`) — new file

- [x] Define `DateRange` interface:
  ```typescript
  export interface DateRange {
    dateFrom: string; // YYYY-MM-DD
    dateTo: string;   // YYYY-MM-DD
  }
  ```
- [x] Define `DatePreset` type:
  ```typescript
  export type DatePreset = '7d' | '30d' | '90d' | 'custom';
  ```
- [x] Define `DashboardFiltersState` interface:
  ```typescript
  export interface DashboardFiltersState {
    preset: DatePreset;
    dateFrom: string; // YYYY-MM-DD
    dateTo: string;   // YYYY-MM-DD
  }
  ```
- [x] Define `KpiData` interface:
  ```typescript
  export interface KpiData {
    label: string;
    value: string | number;
    subLabel?: string;
    trend?: 'up' | 'down' | 'neutral';
  }
  ```
- [x] Define `ChartDataPoint` interface (generic label+value for bar/donut/barlist):
  ```typescript
  export interface ChartDataPoint {
    name: string;
    value: number;
  }
  ```
- [x] Define `TimeSeriesPoint` interface (for AreaChart):
  ```typescript
  export interface TimeSeriesPoint {
    period: string; // e.g. "2025-W01" or "2025-01"
    count: number;
  }
  ```
- [x] Define `DeliveryPerformancePoint` interface (for S5 stacked BarChart):
  ```typescript
  export interface DeliveryPerformancePoint {
    period: string; // "YYYY-MM"
    onTime: number;
    delayed: number;
  }
  ```
- [x] Define `WarehouseUtilizationPoint` interface (for P5 BarChart):
  ```typescript
  export interface WarehouseUtilizationPoint {
    name: string;     // warehouse name
    stock: number;    // total units in stock
    capacity: number; // warehouse capacity
  }
  ```
- [x] Define `LicenseExpiryItem` interface (for F4 BarList):
  ```typescript
  export interface LicenseExpiryItem {
    name: string;  // driver full name
    value: number; // days until expiry (negative if expired)
    href?: string; // optional link to driver detail
  }
  ```
- [x] Export all from `types/dashboard.ts`

---

### 2. Utility helpers (`lib/dashboardUtils.ts`) — new file

Pure functions only — no imports from hooks, services, or React. All take raw data arrays and return computed arrays.

- [x] Export `getDateRange(preset: DatePreset): DateRange`:
  - `'7d'`: today minus 7 days to today
  - `'30d'`: today minus 30 days to today
  - `'90d'`: today minus 90 days to today
  - Returns `{ dateFrom: 'YYYY-MM-DD', dateTo: 'YYYY-MM-DD' }`
  - Helper: `formatDate(d: Date): string` → `d.toISOString().slice(0, 10)`

- [x] Export `groupByStatus<T extends { status: string }>(items: T[]): Record<string, number>`:
  - Returns `{ [status]: count }` for each distinct status value

- [x] Export `groupByWeek(items: Array<{ created_at: string }>): TimeSeriesPoint[]`:
  - Parse `created_at` ISO string → extract ISO week string `YYYY-Www`
  - Count items per week key
  - Return sorted array `[{ period: 'YYYY-W01', count: N }, ...]`

- [x] Export `groupByMonth(items: Array<{ created_at: string }>): TimeSeriesPoint[]`:
  - Parse `created_at` → extract `YYYY-MM`
  - Count items per month key
  - Return sorted array `[{ period: 'YYYY-MM', count: N }, ...]`

- [x] Export `groupByCity(shipments: Array<{ destination_city: string }>): ChartDataPoint[]`:
  - Count per `destination_city`
  - Sort descending by count
  - Return top 10 as `[{ name: city, value: count }, ...]`

- [x] Export `groupByCustomerName(shipments: Array<{ customer: number }>, customersMap: Record<number, string>): ChartDataPoint[]`:
  - Count per customer id, resolve name via `customersMap`
  - Sort descending by count
  - Return top 10 as `[{ name: customerName, value: count }, ...]`

- [x] Export `groupByProductName(items: Array<{ product: number; quantity: number }>, productsMap: Record<number, string>): ChartDataPoint[]`:
  - Sum `quantity` per product id, resolve name via `productsMap`
  - Sort descending by total quantity
  - Return top 10 as `[{ name: productName, value: totalQty }, ...]`

- [x] Export `groupByCategory(items: Array<{ product: number; quantity: number; unit_price_at_shipment: string }>, productsMap: Record<number, { name: string; category: string }>): ChartDataPoint[]`:
  - Sum `quantity * parseFloat(unit_price_at_shipment)` per product category
  - Sort descending
  - Return `[{ name: category, value: totalRevenue }, ...]`

- [x] Export `computeDeliveryPerformance(shipments: Array<{ scheduled_delivery_date: string; actual_delivery_date: string | null; created_at: string }>): DeliveryPerformancePoint[]`:
  - Only include shipments where `actual_delivery_date != null`
  - Group by `YYYY-MM` from `created_at`
  - Per group: `onTime` = count where `actual_delivery_date <= scheduled_delivery_date`, `delayed` = remainder
  - Return sorted `[{ period, onTime, delayed }, ...]`

- [x] Export `computeCumulativeCustomers(customers: Array<{ created_at: string }>): TimeSeriesPoint[]`:
  - Sort by `created_at` ascending
  - Group by `YYYY-MM`
  - Return cumulative running total: `[{ period: 'YYYY-MM', count: cumulativeCount }, ...]`

- [x] Export `computeLicenseExpiry(drivers: Driver[], daysAhead: 30 | 60 | 90): LicenseExpiryItem[]`:
  - Import `Driver` from `@/types/driver`
  - Today = `new Date()`
  - For each driver: `daysUntilExpiry = Math.floor((new Date(driver.license_expiry) - today) / 86400000)`
  - Include driver if `daysUntilExpiry <= daysAhead` (includes negative = already expired)
  - `name` = `driver.user_detail.first_name + ' ' + driver.user_detail.last_name`
  - `value` = `daysUntilExpiry`
  - Sort ascending by `value` (most urgent first)
  - Return `LicenseExpiryItem[]`

---

### 3. Dashboard hooks (`hooks/useDashboard.ts`) — new file

All hooks use `'use client'`. All use `queryClient` singleton from `@/lib/queryClient`. All API calls go through existing service functions, not direct imports of `api.ts`.

- [x] `'use client'` directive at top of file
- [x] Import `useQuery` from `@tanstack/react-query`
- [x] Import `listShipments` from `@/services/shipmentService`
- [x] Import `listDrivers` from `@/services/driverService`
- [x] Import `listRoutes` from `@/services/routeService`
- [x] Import `listWarehouses` from `@/services/warehouseService`
- [x] Import `getWarehouseStock` from `@/services/warehouseService`
- [x] Import `listProducts` from `@/services/productService`
- [x] Import `listCustomers` from `@/services/customerService`
- [x] Import `listTransports` from `@/services/transportService`
- [x] Import relevant param types from `@/types/*`

#### KPI hooks

- [x] Export `useShipmentCountByStatus(status: ShipmentStatus, dateFrom?: string, dateTo?: string)`:
  ```typescript
  useQuery({
    queryKey: ['dashboard', 'shipment-count', status, dateFrom, dateTo],
    queryFn: () => listShipments({
      status,
      page_size: 1,
      ...(dateFrom && { created_at__gte: dateFrom }),
      ...(dateTo && { created_at__lte: dateTo }),
    }),
    select: (data) => data.count,
  })
  ```
  - Returns `{ data: number | undefined, isLoading, isError }`

- [x] Export `useDriverAvailabilityCounts()`:
  ```typescript
  const available = useQuery({
    queryKey: ['dashboard', 'drivers-available'],
    queryFn: () => listDrivers({ is_available: true, page_size: 1 }),
    select: (data) => data.count,
  });
  const total = useQuery({
    queryKey: ['dashboard', 'drivers-total'],
    queryFn: () => listDrivers({ page_size: 1 }),
    select: (data) => data.count,
  });
  return { available, total };
  ```

- [x] Export `useRoutesInProgressCount()`:
  ```typescript
  useQuery({
    queryKey: ['dashboard', 'routes-in-progress'],
    queryFn: () => listRoutes({ status: 'in_progress', page_size: 1 }),
    select: (data) => data.count,
  })
  ```

#### Chart data hooks (bulk fetch for client-side grouping)

- [x] Export `useShipmentsBulk(dateFrom?: string, dateTo?: string)`:
  - Fetches `GET /shipments/?page_size=1000` with optional date filters
  - `queryKey: ['dashboard', 'shipments-bulk', dateFrom, dateTo]`
  - Returns full `PaginatedResponse<Shipment>` (implementer groups client-side via `dashboardUtils`)

- [x] Export `useRoutesBulk()`:
  - Fetches `GET /routes/?page_size=1000`
  - `queryKey: ['dashboard', 'routes-bulk']`

- [x] Export `useDriversBulk()`:
  - Fetches `GET /drivers/?page_size=1000`
  - `queryKey: ['dashboard', 'drivers-bulk']`

- [x] Export `useTransportsBulk(isActive?: boolean)`:
  - Fetches `GET /transports/?page_size=1000` with optional `?is_active=` filter
  - `queryKey: ['dashboard', 'transports-bulk', isActive]`

- [x] Export `useProductsBulk()`:
  - Fetches `GET /products/?page_size=1000&is_active=true`
  - `queryKey: ['dashboard', 'products-bulk']`

- [x] Export `useCustomersBulk(customerType?: string)`:
  - Fetches `GET /customers/?page_size=1000` with optional `?customer_type=` filter
  - `queryKey: ['dashboard', 'customers-bulk', customerType]`

- [x] Export `useWarehousesBulk()`:
  - Fetches `GET /warehouses/?page_size=1000&is_active=true`
  - `queryKey: ['dashboard', 'warehouses-bulk']`

- [x] Export `useAllWarehouseStock(warehouseIds: number[])`:
  - Uses `useQuery` with `queryKey: ['dashboard', 'all-warehouse-stock', warehouseIds]`
  - `queryFn`: calls `getWarehouseStock(id)` for each id in parallel via `Promise.all`
  - `enabled: warehouseIds.length > 0`
  - Returns flattened `WarehouseStock[]` (from all warehouses)

---

### 4. Components (`components/dashboard/`)

All chart components are client components — every file must start with `'use client'`.

#### 4a. `components/dashboard/DashboardFilters.tsx`

- [x] `'use client'`
- [x] Import `DashboardFiltersState`, `DatePreset` from `@/types/dashboard`
- [x] Import `getDateRange` from `@/lib/dashboardUtils`
- [x] Import shadcn `Button`, `Input`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- [x] Props:
  ```typescript
  interface DashboardFiltersProps {
    filters: DashboardFiltersState;
    onChange: (filters: DashboardFiltersState) => void;
  }
  ```
- [x] Preset buttons: `7d`, `30d`, `90d`, `custom` — clicking a preset calls `getDateRange(preset)` and updates both `dateFrom` and `dateTo`; sets `preset`
- [x] When `preset === 'custom'`: show two `Input type="date"` fields (dateFrom, dateTo) that update state directly and set `preset: 'custom'`
- [x] Active preset button uses `variant="default"`; inactive uses `variant="outline"`
- [x] Layout: `flex flex-wrap items-center gap-3` row with label "Período:", preset buttons, and (conditionally) date inputs
- [x] Export `DashboardFilters`

#### 4b. `components/dashboard/KpiCard.tsx`

- [x] `'use client'`
- [x] Import `KpiData` from `@/types/dashboard`
- [x] Import `Skeleton` from `@/components/ui/skeleton`
- [x] Props:
  ```typescript
  interface KpiCardProps {
    data?: KpiData;
    isLoading?: boolean;
    isError?: boolean;
  }
  ```
- [x] Loading state: card with skeleton lines
- [x] Error state: card with `—` value and muted error label
- [x] Normal state: card with `label` (small muted text top), `value` (large metric text center), `subLabel` (small muted text bottom, optional)
- [x] Tailwind classes: `rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-2`
- [x] Export `KpiCard`

#### 4c. `components/dashboard/ShipmentsByStatus.tsx` — S1

- [x] `'use client'`
- [x] Import `DonutChart` from `@tremor/react`
- [x] Import `Skeleton` from `@/components/ui/skeleton`
- [x] Import `useShipmentsBulk` from `@/hooks/useDashboard`
- [x] Import `groupByStatus` from `@/lib/dashboardUtils`
- [x] Import `DashboardFiltersState` from `@/types/dashboard`
- [x] Props: `{ filters: DashboardFiltersState }`
- [x] Calls `useShipmentsBulk(filters.dateFrom, filters.dateTo)`
- [x] Client-side: calls `groupByStatus(data.results)` on fetched results to produce `ChartDataPoint[]`
- [x] Color map:
  ```typescript
  const STATUS_COLORS: Record<string, string> = {
    pending: 'gray',
    processing: 'blue',
    in_transit: 'yellow',
    delivered: 'green',
    cancelled: 'red',
    returned: 'orange',
  };
  ```
- [x] Loading: `<Skeleton className="h-64 w-full rounded-xl" />`
- [x] Error: shadcn `Alert` with "No se pudo cargar datos de envíos"
- [x] Renders: card wrapper with title "Envíos por estado" + `<DonutChart data={chartData} category="value" index="name" colors={colorsArray} showAnimation />`
- [x] Export `ShipmentsByStatus`

#### 4d. `components/dashboard/ShipmentVolumeChart.tsx` — S2

- [x] `'use client'`
- [x] Import `AreaChart` from `@tremor/react`
- [x] Import `Skeleton` from `@/components/ui/skeleton`
- [x] Import `useShipmentsBulk` from `@/hooks/useDashboard`
- [x] Import `groupByWeek`, `groupByMonth` from `@/lib/dashboardUtils`
- [x] Import `DashboardFiltersState` from `@/types/dashboard`
- [x] Props: `{ filters: DashboardFiltersState }`
- [x] Local state: `granularity: 'weekly' | 'monthly'` (default `'weekly'`)
- [x] Granularity toggle: two `Button` components (outline/default variant) — "Semanal" / "Mensual"
- [x] Calls `useShipmentsBulk(filters.dateFrom, filters.dateTo)`
- [x] Client-side grouping: `granularity === 'weekly' ? groupByWeek(results) : groupByMonth(results)`
- [x] Maps `TimeSeriesPoint[]` to `{ period, count }` objects for Tremor `AreaChart`
- [x] Renders: card with title "Volumen de envíos" + granularity toggle + `<AreaChart data={...} index="period" categories={['count']} showAnimation />`
- [x] Loading/error handling same pattern as S1
- [x] Export `ShipmentVolumeChart`

#### 4e. `components/dashboard/TopDestinationCities.tsx` — S3

- [x] `'use client'`
- [x] Import `BarChart` from `@tremor/react`
- [x] Import `useShipmentsBulk` from `@/hooks/useDashboard`
- [x] Import `groupByCity` from `@/lib/dashboardUtils`
- [x] Import `DashboardFiltersState` from `@/types/dashboard`
- [x] Props: `{ filters: DashboardFiltersState }`
- [x] Calls `useShipmentsBulk(filters.dateFrom, filters.dateTo)`
- [x] Client-side: `groupByCity(results)` → top 10
- [x] Renders: card with title "Top 10 ciudades destino" + `<BarChart data={chartData} index="name" categories={['value']} layout="vertical" showAnimation />`
- [x] Loading/error handling same pattern
- [x] Export `TopDestinationCities`

#### 4f. `components/dashboard/RoutesByStatus.tsx` — R1

- [x] `'use client'`
- [x] Import `DonutChart` from `@tremor/react`
- [x] Import `useRoutesBulk` from `@/hooks/useDashboard`
- [x] Import `groupByStatus` from `@/lib/dashboardUtils`
- [x] Color map:
  ```typescript
  const ROUTE_STATUS_COLORS: Record<string, string> = {
    planned: 'blue',
    in_progress: 'yellow',
    completed: 'green',
    cancelled: 'red',
  };
  ```
- [x] Props: none (no date filter on routes)
- [x] Renders: card with title "Rutas por estado" + `<DonutChart ... />`
- [x] Loading/error handling same pattern
- [x] Export `RoutesByStatus`

#### 4g. `components/dashboard/DriverAvailability.tsx` — F1

- [x] `'use client'`
- [x] Import `DonutChart` from `@tremor/react`
- [x] Import `useDriversBulk` from `@/hooks/useDashboard`
- [x] No date filter (current availability state)
- [x] Client-side: count `is_available === true` vs `is_available === false` from `results`
- [x] Produces: `[{ name: 'Disponible', value: N }, { name: 'No disponible', value: M }]`
- [x] Colors: `['green', 'red']`
- [x] Renders: card with title "Disponibilidad de conductores" + `<DonutChart ... />`
- [x] Loading/error handling same pattern
- [x] Export `DriverAvailability`

#### 4h. `components/dashboard/LicenseExpiryAlerts.tsx` — F4

- [x] `'use client'`
- [x] Import `BarList` from `@tremor/react`
- [x] Import `useDriversBulk` from `@/hooks/useDashboard`
- [x] Import `computeLicenseExpiry` from `@/lib/dashboardUtils`
- [x] Local state: `daysAhead: 30 | 60 | 90` (default `30`)
- [x] Days selector: three `Button` components ("30 días" / "60 días" / "90 días")
- [x] Calls `useDriversBulk()` — fetches all drivers
- [x] Client-side: `computeLicenseExpiry(results, daysAhead)` to get `LicenseExpiryItem[]`
- [x] Each `BarList` item label shows: `name + ' (' + (value < 0 ? 'Expirada' : value + 'd') + ')'`
- [x] Items with `value < 0` (expired) highlighted in red via a wrapper `className`
- [x] Empty state: "No hay conductores con licencia próxima a vencer" text
- [x] Renders: card with title "Alertas de licencias" + days selector buttons + `<BarList data={barListData} />`
- [x] Loading/error handling same pattern
- [x] Export `LicenseExpiryAlerts`

#### 4i. `components/dashboard/DeliveryPerformance.tsx` — S5 (Phase 2)

- [x] `'use client'`
- [x] Import `BarChart` from `@tremor/react`
- [x] Import `useShipmentsBulk` from `@/hooks/useDashboard`
- [x] Import `computeDeliveryPerformance` from `@/lib/dashboardUtils`
- [x] Import `DashboardFiltersState` from `@/types/dashboard`
- [x] Props: `{ filters: DashboardFiltersState }`
- [x] Calls `useShipmentsBulk(filters.dateFrom, filters.dateTo)`
- [x] Client-side: `computeDeliveryPerformance(results)` → `DeliveryPerformancePoint[]`
- [x] Renders: card with title "Rendimiento de entregas" + `<BarChart data={...} index="period" categories={['onTime', 'delayed']} stack colors={['green', 'red']} showAnimation />`
- [x] Loading/error handling same pattern
- [x] Export `DeliveryPerformance`

#### 4j. `components/dashboard/TopCustomers.tsx` — S6 (Phase 2)

- [x] `'use client'`
- [x] Import `BarList` from `@tremor/react`
- [x] Import `useShipmentsBulk`, `useCustomersBulk` from `@/hooks/useDashboard`
- [x] Import `groupByCustomerName` from `@/lib/dashboardUtils`
- [x] Import `DashboardFiltersState` from `@/types/dashboard`
- [x] Props: `{ filters: DashboardFiltersState }`
- [x] Both queries run in parallel
- [x] Build `customersMap: Record<number, string>` from customers `results` (`id → name`)
- [x] Client-side: `groupByCustomerName(shipmentResults, customersMap)` → top 10
- [x] Renders: card with title "Top 10 clientes por envíos" + `<BarList data={...} />`
- [x] Loading/error handling same pattern
- [x] Export `TopCustomers`

#### 4k. `components/dashboard/RevenueByCategory.tsx` — P3 (Phase 2)

- [x] `'use client'`
- [x] Import `BarChart` from `@tremor/react`
- [x] Import `useShipmentsBulk`, `useProductsBulk` from `@/hooks/useDashboard`
- [x] Import `groupByCategory` from `@/lib/dashboardUtils`
- [x] Import `DashboardFiltersState` from `@/types/dashboard`
- [x] Props: `{ filters: DashboardFiltersState }`
- [x] Both queries run in parallel; `isLoading` = either loading
- [x] Build `productsMap: Record<number, { name: string; category: string }>` from products `results`
- [x] Client-side: collect all `ShipmentItem[]` from all fetched shipments, call `groupByCategory(allItems, productsMap)`
- [x] Renders: card with title "Ingresos por categoría" + `<BarChart data={...} index="name" categories={['value']} showAnimation />`
- [x] Loading/error handling same pattern
- [x] Export `RevenueByCategory`

#### 4l. `components/dashboard/TopShippedProducts.tsx` — P2 (Phase 2)

- [x] `'use client'`
- [x] Import `BarList` from `@tremor/react`
- [x] Import `useShipmentsBulk`, `useProductsBulk` from `@/hooks/useDashboard`
- [x] Import `groupByProductName` from `@/lib/dashboardUtils`
- [x] Import `DashboardFiltersState` from `@/types/dashboard`
- [x] Props: `{ filters: DashboardFiltersState }`
- [x] Both queries run in parallel
- [x] Build `productsMap: Record<number, string>` from products `results` (`id → name`)
- [x] Collect all `ShipmentItem[]` from all fetched shipments
- [x] Client-side: `groupByProductName(allItems, productsMap)` → top 10
- [x] Renders: card with title "Top 10 productos enviados" + `<BarList data={...} />`
- [x] Loading/error handling same pattern
- [x] Export `TopShippedProducts`

#### 4m. `components/dashboard/WarehouseUtilization.tsx` — P5 (Phase 3)

- [x] `'use client'`
- [x] Import `BarChart` from `@tremor/react`
- [x] Import `useWarehousesBulk`, `useAllWarehouseStock` from `@/hooks/useDashboard`
- [x] Import `WarehouseUtilizationPoint` from `@/types/dashboard`
- [x] No date filter (current state)
- [x] Fetch all active warehouses first
- [x] Extract `warehouseIds: number[]` from warehouses results
- [x] Call `useAllWarehouseStock(warehouseIds)` — enabled only when `warehouseIds.length > 0`
- [x] Client-side: for each warehouse, sum all stock quantities from flattened stock array, produce `WarehouseUtilizationPoint[]`:
  ```typescript
  warehouses.results.map(w => ({
    name: w.name,
    stock: stockByWarehouse[w.id] ?? 0,
    capacity: w.capacity,
  }))
  ```
- [x] Renders: card with title "Utilización de almacenes" + `<BarChart data={...} index="name" categories={['stock', 'capacity']} showAnimation />`
- [x] Loading: both queries must complete before rendering chart
- [x] Loading/error handling same pattern
- [x] Export `WarehouseUtilization`

#### 4n. `components/dashboard/FleetByType.tsx` — F2 (Phase 3)

- [x] `'use client'`
- [x] Import `DonutChart` from `@tremor/react`
- [x] Import `useTransportsBulk` from `@/hooks/useDashboard`
- [x] Local state: `showActiveOnly: boolean` (default `true`)
- [x] Toggle: `Button` "Solo activos" / "Todos" to flip `showActiveOnly`
- [x] Calls `useTransportsBulk(showActiveOnly ? true : undefined)`
- [x] Client-side: count per `transport_type`
- [x] Transport type labels:
  ```typescript
  const TYPE_LABELS: Record<string, string> = {
    truck: 'Camión',
    van: 'Furgoneta',
    motorcycle: 'Motocicleta',
    bicycle: 'Bicicleta',
  };
  ```
- [x] Renders: card with title "Flota por tipo" + toggle + `<DonutChart ... />`
- [x] Loading/error handling same pattern
- [x] Export `FleetByType`

#### 4o. `components/dashboard/CustomerTypeChart.tsx` — C1 (Phase 3)

- [x] `'use client'`
- [x] Import `DonutChart` from `@tremor/react`
- [x] Import `useCustomersBulk` from `@/hooks/useDashboard`
- [x] Local state: `showActiveOnly: boolean` (default `true`)
- [x] Toggle: `Button` "Solo activos" / "Todos"
- [x] Calls `useCustomersBulk()` and filters client-side if `showActiveOnly`
- [x] Client-side: count `company` vs `individual`
- [x] Produces: `[{ name: 'Empresa', value: N }, { name: 'Individual', value: M }]`
- [x] Colors: `['blue', 'cyan']`
- [x] Renders: card with title "Tipo de clientes" + toggle + `<DonutChart ... />`
- [x] Loading/error handling same pattern
- [x] Export `CustomerTypeChart`

#### 4p. `components/dashboard/CustomerGrowth.tsx` — C4 (Phase 3)

- [x] `'use client'`
- [x] Import `AreaChart` from `@tremor/react`
- [x] Import `useCustomersBulk` from `@/hooks/useDashboard`
- [x] Import `computeCumulativeCustomers` from `@/lib/dashboardUtils`
- [x] Local state: `customerType: 'all' | 'company' | 'individual'` (default `'all'`)
- [x] Customer type select: shadcn `Select` with options "Todos" / "Empresa" / "Individual"
- [x] Calls `useCustomersBulk(customerType === 'all' ? undefined : customerType)`
- [x] Client-side: `computeCumulativeCustomers(results)` → `TimeSeriesPoint[]`
- [x] Renders: card with title "Crecimiento de clientes" + type select + `<AreaChart data={...} index="period" categories={['count']} showAnimation />`
- [x] Loading/error handling same pattern
- [x] Export `CustomerGrowth`

---

### 5. Pages

#### 5a. `app/(app)/dashboard/page.tsx` — main dashboard page

- [x] Server Component shell — no `'use client'` at file level
- [x] Export `metadata` object:
  ```typescript
  export const metadata = { title: 'Dashboard | Logística' };
  ```
- [x] Import and render `DashboardClientSection` (the client-side orchestrator) from `./DashboardClientSection`
- [x] Render:
  ```tsx
  export default function DashboardPage() {
    return <DashboardClientSection />;
  }
  ```

#### 5b. `app/(app)/dashboard/DashboardClientSection.tsx` — client orchestrator

- [x] `'use client'`
- [x] Import `useState` from `react`
- [x] Import `DashboardFiltersState`, `DatePreset` from `@/types/dashboard`
- [x] Import `getDateRange` from `@/lib/dashboardUtils`
- [x] Import all chart and KPI components from `@/components/dashboard/*`
- [x] Import KPI hooks: `useShipmentCountByStatus`, `useDriverAvailabilityCounts`, `useRoutesInProgressCount` from `@/hooks/useDashboard`

- [x] Initialize filter state:
  ```typescript
  const [filters, setFilters] = useState<DashboardFiltersState>(() => {
    const range = getDateRange('30d');
    return { preset: '30d', ...range };
  });
  ```

- [x] KPI data assembly:
  - `pendingCount` = `useShipmentCountByStatus('pending', filters.dateFrom, filters.dateTo)`
  - `processingCount` = `useShipmentCountByStatus('processing', filters.dateFrom, filters.dateTo)`
  - `inTransitCount` = `useShipmentCountByStatus('in_transit', filters.dateFrom, filters.dateTo)`
  - `deliveredCount` = `useShipmentCountByStatus('delivered', filters.dateFrom, filters.dateTo)`
  - `cancelledCount` = `useShipmentCountByStatus('cancelled', filters.dateFrom, filters.dateTo)`
  - `returnedCount` = `useShipmentCountByStatus('returned', filters.dateFrom, filters.dateTo)`
  - `driverCounts` = `useDriverAvailabilityCounts()`
  - `routesInProgress` = `useRoutesInProgressCount()`

- [x] Computed KPI values:
  - `activeShipments = (pendingCount.data ?? 0) + (processingCount.data ?? 0) + (inTransitCount.data ?? 0)`
  - `totalFinished = (deliveredCount.data ?? 0) + (cancelledCount.data ?? 0) + (returnedCount.data ?? 0)`
  - `deliveryRate = totalFinished > 0 ? Math.round(((deliveredCount.data ?? 0) / totalFinished) * 100) : 0`
  - `availableDrivers = driverCounts.available.data ?? 0`
  - `totalDrivers = driverCounts.total.data ?? 0`

- [x] Layout structure implemented with all sections and responsive grid
- [x] Export default `DashboardClientSection`

---

### 6. Integration Checks

- [x] `@tremor/react` installed — verify `npm install @tremor/react` ran without errors and package appears in `package.json`
- [x] All chart components have `'use client'` — Tremor components are client-only and will throw if rendered in a Server Component without it
- [x] `DashboardClientSection.tsx` has `'use client'` — it uses `useState` and calls hooks
- [x] `useDashboard.ts` has `'use client'` — it uses `useQuery`
- [x] `dashboardUtils.ts` has NO `'use client'` — it is a pure utility module (no React, no browser APIs), callable from both server and client
- [x] `types/dashboard.ts` has NO `'use client'` — plain TypeScript types
- [x] `page.tsx` has NO `'use client'` — Server Component shell
- [x] All `useQuery` calls in `useDashboard.ts` use `queryKey` arrays that include all filter params (so queries re-run when filters change)
- [x] `DashboardFilters` `onChange` triggers re-render of `DashboardClientSection` which propagates new `filters` to all chart components — their `queryKey`s change, triggering fresh fetches
- [x] `getDateRange` helper imported from `@/lib/dashboardUtils` in both `DashboardFilters` and `DashboardClientSection` — not duplicated
- [x] `queryClient` singleton from `@/lib/queryClient` is used (not a second `new QueryClient()`)
- [x] Error states: each chart component renders a `shadcn Alert` (or plain div with muted error text) when `isError` is true — no unhandled exceptions propagate to page level
- [x] Loading states: each chart component renders `<Skeleton className="h-64 w-full rounded-xl" />` when `isLoading` is true
- [x] Responsive grid: `grid-cols-1` on mobile, `lg:grid-cols-2` on tablet, `xl:grid-cols-3` or `xl:grid-cols-4` on desktop
- [x] Sidebar `/dashboard` link added at the top of `navLinks` in `components/layout/Sidebar.tsx`
- [x] `useAllWarehouseStock` correctly uses `Promise.all` inside `queryFn` and is enabled only when `warehouseIds.length > 0`
- [x] `computeLicenseExpiry` in `dashboardUtils.ts` handles the case where `results` is empty (returns `[]`)
- [x] TypeScript strict: no `any` — all Tremor component props typed from `@tremor/react` types or explicit inline types
- [x] `page_size` query param used in bulk hooks — confirm that `ShipmentListParams` etc. support `page_size`; if not, add `page_size?: number` to the relevant param types or pass via `params` object directly in `queryFn`

---

## File Checklist

```
app/(app)/dashboard/
├── page.tsx                        ← new (Server Component shell)
└── DashboardClientSection.tsx      ← new ('use client' orchestrator)

components/dashboard/
├── DashboardFilters.tsx            ← new
├── KpiCard.tsx                     ← new
├── ShipmentsByStatus.tsx           ← new (S1)
├── ShipmentVolumeChart.tsx         ← new (S2)
├── TopDestinationCities.tsx        ← new (S3)
├── RoutesByStatus.tsx              ← new (R1)
├── DriverAvailability.tsx          ← new (F1)
├── LicenseExpiryAlerts.tsx         ← new (F4)
├── DeliveryPerformance.tsx         ← new (S5, Phase 2)
├── TopCustomers.tsx                ← new (S6, Phase 2)
├── RevenueByCategory.tsx           ← new (P3, Phase 2)
├── TopShippedProducts.tsx          ← new (P2, Phase 2)
├── WarehouseUtilization.tsx        ← new (P5, Phase 3)
├── FleetByType.tsx                 ← new (F2, Phase 3)
├── CustomerTypeChart.tsx           ← new (C1, Phase 3)
└── CustomerGrowth.tsx              ← new (C4, Phase 3)

hooks/
└── useDashboard.ts                 ← new

types/
└── dashboard.ts                    ← new

lib/
└── dashboardUtils.ts               ← new
```

**Files to modify**:
- `components/layout/Sidebar.tsx` — add `/dashboard` nav link with `LayoutDashboard` icon as first entry

---

## Dependencies

- **All 8 business modules**: complete — Auth, Suppliers, Warehouses, Customers, Products, Drivers, Transports, Routes, Shipments
- All existing hooks (`useShipments`, `useDrivers`, `useRoutes`, `useWarehouses`, `useWarehouseStock`, `useProducts`, `useCustomers`, `useTransports`) exist and are importable
- All existing services (shipmentService, warehouseService, driverService, routeService, productService, customerService, transportService) exist
- All existing types (Shipment, Driver, Route, Warehouse, WarehouseStock, Product, Customer, Transport) exist
- `@tremor/react` must be installed (Phase 0 task)
- `shadcn Alert` component may need installation — check `components/ui/` for `alert.tsx`; if absent, run `npx shadcn add alert`
