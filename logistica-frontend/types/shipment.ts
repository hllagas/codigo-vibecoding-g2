export type ShipmentStatus =
  | 'pending'
  | 'processing'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export const SHIPMENT_VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending:    ['processing', 'cancelled'],
  processing: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'returned'],
  delivered:  [],
  cancelled:  [],
  returned:   [],
};

export interface ShipmentItem {
  id: number;
  shipment: number;
  product: number;
  quantity: number;
  unit_price_at_shipment: string;
}

export interface Shipment {
  id: number;
  tracking_number: string;
  customer: number;
  origin_warehouse: number;
  route: number | null;
  destination_address: string;
  destination_city: string;
  destination_country: string;
  status: ShipmentStatus;
  scheduled_delivery_date: string;
  actual_delivery_date: string | null;
  total_weight_kg: string;
  notes: string | null;
  items: ShipmentItem[];
  created_at: string;
  updated_at: string;
}

export type ShipmentItemCreate = {
  product: number;
  quantity: number;
  unit_price_at_shipment: string;
};

export type ShipmentCreate = {
  tracking_number: string;
  customer: number;
  origin_warehouse: number;
  route: number | null;
  destination_address: string;
  destination_city: string;
  destination_country: string;
  status: ShipmentStatus;
  scheduled_delivery_date: string;
  actual_delivery_date: string | null;
  total_weight_kg: string;
  notes: string | null;
  items: ShipmentItemCreate[];
};

export type ShipmentUpdate = Partial<Omit<ShipmentCreate, 'items'>>;

export type ShipmentStatusUpdate = { status: ShipmentStatus };

export interface ShipmentListParams {
  page?: number;
  search?: string;
  status?: ShipmentStatus;
  customer?: number;
  origin_warehouse?: number;
  route?: number;
  ordering?: string;
}
