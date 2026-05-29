import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type { Warehouse, WarehouseCreate, WarehouseUpdate, WarehouseListParams, WarehouseStock } from '@/types/warehouse';
import type { PaginatedResponse } from '@/types/pagination';

export function listWarehouses(params?: WarehouseListParams): Promise<PaginatedResponse<Warehouse>> {
  return apiGet<PaginatedResponse<Warehouse>>('/warehouses/', { params });
}

export function getWarehouse(id: number): Promise<Warehouse> {
  return apiGet<Warehouse>(`/warehouses/${id}/`);
}

export function createWarehouse(data: WarehouseCreate): Promise<Warehouse> {
  return apiPost<Warehouse>('/warehouses/', data);
}

export function updateWarehouse(id: number, data: WarehouseCreate): Promise<Warehouse> {
  return apiPut<Warehouse>(`/warehouses/${id}/`, data);
}

export function patchWarehouse(id: number, data: WarehouseUpdate): Promise<Warehouse> {
  return apiPatch<Warehouse>(`/warehouses/${id}/`, data);
}

export function deleteWarehouse(id: number): Promise<void> {
  return apiDelete<void>(`/warehouses/${id}/`);
}

export function getWarehouseStock(id: number): Promise<PaginatedResponse<WarehouseStock>> {
  return apiGet<PaginatedResponse<WarehouseStock>>(`/warehouses/${id}/stock/`);
}
