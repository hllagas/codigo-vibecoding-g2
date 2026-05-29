'use client';

import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { createDriver, updateDriver, patchDriver, deleteDriver } from '@/services/driverService';
import type { DriverCreate, DriverUpdate } from '@/types/driver';

export function useCreateDriver() {
  return useMutation({
    mutationFn: (data: DriverCreate) => createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}

export function useUpdateDriver() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DriverCreate }) => updateDriver(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['drivers', id] });
    },
  });
}

export function usePatchDriver() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DriverUpdate }) => patchDriver(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['drivers', id] });
    },
  });
}

export function useDeleteDriver() {
  return useMutation({
    mutationFn: (id: number) => deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}
