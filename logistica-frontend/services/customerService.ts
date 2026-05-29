import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type { Customer, CustomerCreate, CustomerUpdate, CustomerListParams } from '@/types/customer';
import type { PaginatedResponse } from '@/types/pagination';

export function listCustomers(params?: CustomerListParams): Promise<PaginatedResponse<Customer>> {
  return apiGet<PaginatedResponse<Customer>>('/customers/', { params });
}

export function getCustomer(id: number): Promise<Customer> {
  return apiGet<Customer>(`/customers/${id}/`);
}

export function createCustomer(data: CustomerCreate): Promise<Customer> {
  return apiPost<Customer>('/customers/', data);
}

export function updateCustomer(id: number, data: CustomerCreate): Promise<Customer> {
  return apiPut<Customer>(`/customers/${id}/`, data);
}

export function patchCustomer(id: number, data: CustomerUpdate): Promise<Customer> {
  return apiPatch<Customer>(`/customers/${id}/`, data);
}

export function deleteCustomer(id: number): Promise<void> {
  return apiDelete<void>(`/customers/${id}/`);
}
