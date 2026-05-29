'use client';

import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import {
  createTransport,
  updateTransport,
  patchTransport,
  deleteTransport,
} from '@/services/transportService';
import type { TransportCreate, TransportUpdate } from '@/types/transport';

export function useCreateTransport() {
  return useMutation({
    mutationFn: (data: TransportCreate) => createTransport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
    },
  });
}

export function useUpdateTransport() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransportCreate }) => updateTransport(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      queryClient.invalidateQueries({ queryKey: ['transports', id] });
    },
  });
}

export function usePatchTransport() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransportUpdate }) => patchTransport(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
      queryClient.invalidateQueries({ queryKey: ['transports', id] });
    },
  });
}

export function useDeleteTransport() {
  return useMutation({
    mutationFn: (id: number) => deleteTransport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transports'] });
    },
  });
}
