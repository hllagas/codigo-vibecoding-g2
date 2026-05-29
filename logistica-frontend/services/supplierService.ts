import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type { Supplier, SupplierCreate, SupplierUpdate, SupplierListParams } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/pagination';

export function listSuppliers(params?: SupplierListParams): Promise<PaginatedResponse<Supplier>> {
  return apiGet<PaginatedResponse<Supplier>>('/suppliers/', { params });
}

export function getSupplier(id: number): Promise<Supplier> {
  return apiGet<Supplier>(`/suppliers/${id}/`);
}

export function createSupplier(data: SupplierCreate): Promise<Supplier> {
  return apiPost<Supplier>('/suppliers/', data);
}

export function updateSupplier(id: number, data: SupplierCreate): Promise<Supplier> {
  return apiPut<Supplier>(`/suppliers/${id}/`, data);
}

export function patchSupplier(id: number, data: SupplierUpdate): Promise<Supplier> {
  return apiPatch<Supplier>(`/suppliers/${id}/`, data);
}

export function deleteSupplier(id: number): Promise<void> {
  return apiDelete<void>(`/suppliers/${id}/`);
}
