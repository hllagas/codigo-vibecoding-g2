import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type { Transport, TransportCreate, TransportUpdate, TransportListParams } from '@/types/transport';
import type { PaginatedResponse } from '@/types/pagination';

export function listTransports(params?: TransportListParams): Promise<PaginatedResponse<Transport>> {
  return apiGet<PaginatedResponse<Transport>>('/transports/', { params });
}

export function getTransport(id: number): Promise<Transport> {
  return apiGet<Transport>(`/transports/${id}/`);
}

export function createTransport(data: TransportCreate): Promise<Transport> {
  return apiPost<Transport>('/transports/', data);
}

export function updateTransport(id: number, data: TransportCreate): Promise<Transport> {
  return apiPut<Transport>(`/transports/${id}/`, data);
}

export function patchTransport(id: number, data: TransportUpdate): Promise<Transport> {
  return apiPatch<Transport>(`/transports/${id}/`, data);
}

export function deleteTransport(id: number): Promise<void> {
  return apiDelete<void>(`/transports/${id}/`);
}
