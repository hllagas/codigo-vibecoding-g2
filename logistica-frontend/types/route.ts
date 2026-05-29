export type RouteStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface RouteStop {
  id: number;
  route: number;
  stop_order: number;
  address: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
}

export interface Route {
  id: number;
  name: string;
  origin_warehouse: number;
  transport: number;
  status: RouteStatus;
  estimated_duration_hours: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RouteCreate = {
  name: string;
  origin_warehouse: number;
  transport: number;
  status: RouteStatus;
  estimated_duration_hours: string | null;
  started_at: string | null;
  completed_at: string | null;
};

export type RouteUpdate = Partial<RouteCreate>;

export type RouteStopCreate = {
  stop_order: number;
  address: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
};

export type RouteStopUpdate = Partial<RouteStopCreate>;

export interface RouteListParams {
  page?: number;
  search?: string;
  status?: RouteStatus;
  transport?: number;
  origin_warehouse?: number;
  ordering?: string;
}
