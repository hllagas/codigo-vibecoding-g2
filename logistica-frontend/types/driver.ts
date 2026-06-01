export interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Driver {
  id: number;
  user: number;
  user_detail: UserDetail;
  license_number: string;
  license_expiry: string;
  phone: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export type DriverCreate = {
  user: number;
  license_number: string;
  license_expiry: string;
  phone: string;
  is_available: boolean;
};

export type DriverUpdate = Partial<DriverCreate>;

export interface DriverListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_available?: boolean;
  ordering?: string;
}
