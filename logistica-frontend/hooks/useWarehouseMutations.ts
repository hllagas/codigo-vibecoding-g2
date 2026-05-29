'use client';

import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import {
  createWarehouse,
  updateWarehouse,
  patchWarehouse,
  deleteWarehouse,
} from '@/services/warehouseService';
import type { WarehouseCreate, WarehouseUpdate } from '@/types/warehouse';

export function useCreateWarehouse() {
  return useMutation({
    mutationFn: (data: WarehouseCreate) => createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

export function useUpdateWarehouse() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WarehouseCreate }) =>
      updateWarehouse(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', id] });
    },
  });
}

export function usePatchWarehouse() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WarehouseUpdate }) =>
      patchWarehouse(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', id] });
    },
  });
}

export function useDeleteWarehouse() {
  return useMutation({
    mutationFn: (id: number) => deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}
