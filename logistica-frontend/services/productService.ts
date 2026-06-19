import api, { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type { Product, ProductCreate, ProductUpdate, ProductListParams } from '@/types/product';
import type { PaginatedResponse } from '@/types/pagination';

export function listProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
  return apiGet<PaginatedResponse<Product>>('/products/', { params });
}

export function getProduct(id: number): Promise<Product> {
  return apiGet<Product>(`/products/${id}/`);
}

export function createProduct(data: ProductCreate): Promise<Product> {
  return apiPost<Product>('/products/', data);
}

export function updateProduct(id: number, data: ProductCreate): Promise<Product> {
  return apiPut<Product>(`/products/${id}/`, data);
}

export function patchProduct(id: number, data: ProductUpdate): Promise<Product> {
  return apiPatch<Product>(`/products/${id}/`, data);
}

export function deleteProduct(id: number): Promise<void> {
  return apiDelete<void>(`/products/${id}/`);
}

export async function uploadProductImage(id: number, file: File): Promise<Product> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post<Product>(`/products/${id}/upload-image/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
