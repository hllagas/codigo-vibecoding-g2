export interface Supplier {
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

export type SupplierCreate = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;

export type SupplierUpdate = Partial<SupplierCreate>;

export interface SupplierListParams {
  page?: number;
  search?: string;
  city?: string;
  country?: string;
  is_active?: boolean;
  ordering?: string;
}
