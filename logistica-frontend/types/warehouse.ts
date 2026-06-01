export interface Warehouse {
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

export type WarehouseCreate = Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>;

export type WarehouseUpdate = Partial<WarehouseCreate>;

export interface WarehouseListParams {
  page?: number;
  page_size?: number;
  search?: string;       // name | address | city
  city?: string;
  country?: string;
  is_active?: boolean;
  ordering?: string;     // 'name' | '-capacity' | '-created_at' | ...
}

export interface WarehouseStock {
  id: number;
  warehouse: number;
  product: number;
  quantity: number;
  updated_at: string;    // ISO 8601
}
