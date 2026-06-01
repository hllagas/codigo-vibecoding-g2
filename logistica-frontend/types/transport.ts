export type TransportType = 'truck' | 'van' | 'motorcycle' | 'bicycle';

export interface DriverDetail {
  id: number;
  license_number: string;
  phone: string;
  is_available: boolean;
}

export interface Transport {
  id: number;
  name: string;
  plate_number: string;
  transport_type: TransportType;
  capacity_kg: string;
  driver: number | null;
  driver_detail: DriverDetail | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransportCreate = {
  name: string;
  plate_number: string;
  transport_type: TransportType;
  capacity_kg: string;
  driver: number | null;
  is_active: boolean;
};

export type TransportUpdate = Partial<TransportCreate>;

export interface TransportListParams {
  page?: number;
  page_size?: number;
  search?: string;
  transport_type?: TransportType;
  is_active?: boolean;
  driver?: number;
  ordering?: string;
}
