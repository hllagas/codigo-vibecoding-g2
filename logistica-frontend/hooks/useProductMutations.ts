'use client';

import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { createProduct, updateProduct, patchProduct, deleteProduct, uploadProductImage } from '@/services/productService';
import type { ProductCreate, ProductUpdate } from '@/types/product';

export function useCreateProduct() {
  return useMutation({
    mutationFn: (data: ProductCreate) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductCreate }) => updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  });
}

export function usePatchProduct() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdate }) => patchProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUploadProductImage() {
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadProductImage(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  });
}
