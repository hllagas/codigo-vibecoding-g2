import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type { Driver, DriverCreate, DriverUpdate, DriverListParams } from '@/types/driver';
import type { PaginatedResponse } from '@/types/pagination';

export function listDrivers(params?: DriverListParams): Promise<PaginatedResponse<Driver>> {
  return apiGet<PaginatedResponse<Driver>>('/drivers/', { params });
}

export function getDriver(id: number): Promise<Driver> {
  return apiGet<Driver>(`/drivers/${id}/`);
}

export function createDriver(data: DriverCreate): Promise<Driver> {
  return apiPost<Driver>('/drivers/', data);
}

export function updateDriver(id: number, data: DriverCreate): Promise<Driver> {
  return apiPut<Driver>(`/drivers/${id}/`, data);
}

export function patchDriver(id: number, data: DriverUpdate): Promise<Driver> {
  return apiPatch<Driver>(`/drivers/${id}/`, data);
}

export function deleteDriver(id: number): Promise<void> {
  return apiDelete<void>(`/drivers/${id}/`);
}
