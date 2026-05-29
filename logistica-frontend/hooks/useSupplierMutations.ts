'use client';

import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import {
  createSupplier,
  updateSupplier,
  patchSupplier,
  deleteSupplier,
} from '@/services/supplierService';
import type { SupplierCreate, SupplierUpdate } from '@/types/supplier';

export function useCreateSupplier() {
  return useMutation({
    mutationFn: (data: SupplierCreate) => createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateSupplier() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierCreate }) =>
      updateSupplier(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers', id] });
    },
  });
}

export function usePatchSupplier() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierUpdate }) =>
      patchSupplier(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers', id] });
    },
  });
}

export function useDeleteSupplier() {
  return useMutation({
    mutationFn: (id: number) => deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
