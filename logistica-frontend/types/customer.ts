export type CustomerType = 'company' | 'individual';

export interface Customer {
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

export type CustomerCreate = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type CustomerUpdate = Partial<CustomerCreate>;

export interface CustomerListParams {
  page?: number;
  search?: string;
  customer_type?: CustomerType;
  city?: string;
  country?: string;
  is_active?: boolean;
  ordering?: string;
}
