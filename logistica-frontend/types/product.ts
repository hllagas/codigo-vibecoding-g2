export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  category: string;
  unit_price: string;
  weight_kg: string;
  supplier: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductCreate = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

export type ProductUpdate = Partial<ProductCreate>;

export interface ProductListParams {
  page?: number;
  search?: string;
  category?: string;
  supplier?: number;
  is_active?: boolean;
  ordering?: string;
}
