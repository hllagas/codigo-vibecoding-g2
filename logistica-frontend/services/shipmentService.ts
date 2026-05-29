import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type {
  Shipment,
  ShipmentCreate,
  ShipmentUpdate,
  ShipmentListParams,
  ShipmentStatus,
} from '@/types/shipment';
import type { PaginatedResponse } from '@/types/pagination';

export function listShipments(params?: ShipmentListParams): Promise<PaginatedResponse<Shipment>> {
  return apiGet<PaginatedResponse<Shipment>>('/shipments/', { params });
}

export function getShipment(id: number): Promise<Shipment> {
  return apiGet<Shipment>(`/shipments/${id}/`);
}

export function createShipment(data: ShipmentCreate): Promise<Shipment> {
  return apiPost<Shipment>('/shipments/', data);
}

export function updateShipment(id: number, data: ShipmentUpdate): Promise<Shipment> {
  return apiPut<Shipment>(`/shipments/${id}/`, data);
}

export function patchShipment(id: number, data: ShipmentUpdate): Promise<Shipment> {
  return apiPatch<Shipment>(`/shipments/${id}/`, data);
}

export function deleteShipment(id: number): Promise<void> {
  return apiDelete<void>(`/shipments/${id}/`);
}

export function updateShipmentStatus(id: number, status: ShipmentStatus): Promise<Shipment> {
  return apiPatch<Shipment>(`/shipments/${id}/status/`, { status });
}
