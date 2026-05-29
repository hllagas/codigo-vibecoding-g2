# Data Models — TypeScript Interfaces

Derived from Django models in `logistica-api`. Use these as the source of truth for all TypeScript types in `src/types/`.

---

## Auth

```typescript
interface TokenPair {
  access: string;
  refresh: string;
}

interface TokenRefreshResponse {
  access: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}
```

---

## Pagination (generic wrapper)

All list endpoints return a paginated response:

```typescript
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

---

## Supplier

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

type SupplierCreate = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
type SupplierUpdate = Partial<SupplierCreate>;
```

---

## Warehouse

```typescript
interface Warehouse {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: string | null;  // decimal string from Django
  longitude: string | null;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WarehouseStock {
  id: number;
  warehouse: number;
  product: number;
  quantity: number;
  updated_at: string;
}

type WarehouseCreate = Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>;
type WarehouseUpdate = Partial<WarehouseCreate>;
```

---

## Customer

```typescript
type CustomerType = 'company' | 'individual';

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
  created_at: string;
  updated_at: string;
}

type CustomerCreate = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
type CustomerUpdate = Partial<CustomerCreate>;
```

---

## Product

```typescript
interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  category: string;
  unit_price: string;  // decimal string
  weight_kg: string;   // decimal string
  supplier: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type ProductCreate = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
type ProductUpdate = Partial<ProductCreate>;
```

---

## Driver

```typescript
interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Driver {
  id: number;
  user: number;
  user_detail: UserDetail;  // read-only nested object
  license_number: string;
  license_expiry: string;   // date YYYY-MM-DD
  phone: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

type DriverCreate = {
  user: number;
  license_number: string;
  license_expiry: string;
  phone: string;
  is_available?: boolean;
};
type DriverUpdate = Partial<DriverCreate>;
```

---

## Transport

```typescript
type TransportType = 'truck' | 'van' | 'motorcycle' | 'bicycle';

interface DriverDetail {
  id: number;
  license_number: string;
  phone: string;
  is_available: boolean;
}

interface Transport {
  id: number;
  name: string;
  plate_number: string;
  transport_type: TransportType;
  capacity_kg: string;        // decimal string
  driver: number | null;
  driver_detail: DriverDetail | null;  // read-only nested object
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type TransportCreate = {
  name: string;
  plate_number: string;
  transport_type: TransportType;
  capacity_kg: string | number;
  driver?: number | null;
  is_active?: boolean;
};
type TransportUpdate = Partial<TransportCreate>;
```

---

## Route

```typescript
type RouteStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

interface RouteStop {
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

interface Route {
  id: number;
  name: string;
  origin_warehouse: number;
  transport: number;
  status: RouteStatus;
  estimated_duration_hours: string | null;  // decimal string
  started_at: string | null;     // ISO 8601
  completed_at: string | null;   // ISO 8601
  created_at: string;
  updated_at: string;
}

type RouteCreate = Omit<Route, 'id' | 'created_at' | 'updated_at'>;
type RouteUpdate = Partial<RouteCreate>;

type RouteStopCreate = Omit<RouteStop, 'id' | 'route'>;
type RouteStopUpdate = Partial<RouteStopCreate>;
```

---

## Shipment

```typescript
type ShipmentStatus =
  | 'pending'
  | 'processing'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'returned';

interface ShipmentItem {
  id: number;
  shipment: number;
  product: number;
  quantity: number;
  unit_price_at_shipment: string;  // decimal string
}

interface Shipment {
  id: number;
  tracking_number: string;
  customer: number;
  origin_warehouse: number;
  route: number | null;
  destination_address: string;
  destination_city: string;
  destination_country: string;
  status: ShipmentStatus;
  scheduled_delivery_date: string;   // YYYY-MM-DD
  actual_delivery_date: string | null;
  total_weight_kg: string;           // decimal string
  notes: string | null;
  items: ShipmentItem[];             // nested in GET responses
  created_at: string;
  updated_at: string;
}

type ShipmentItemCreate = {
  product: number;
  quantity: number;
  unit_price_at_shipment: string | number;
};

type ShipmentCreate = Omit<Shipment, 'id' | 'created_at' | 'updated_at' | 'items'> & {
  items: ShipmentItemCreate[];
};
type ShipmentUpdate = Partial<Omit<ShipmentCreate, 'items'>>;

interface ShipmentStatusUpdate {
  status: ShipmentStatus;
}

// Valid transitions map (for frontend validation before API call)
const SHIPMENT_VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending:     ['processing', 'cancelled'],
  processing:  ['in_transit', 'cancelled'],
  in_transit:  ['delivered', 'returned'],
  delivered:   [],
  cancelled:   [],
  returned:    [],
};
```
