'use client';

import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { createRoute, updateRoute, patchRoute, deleteRoute } from '@/services/routeService';
import type { RouteCreate, RouteUpdate } from '@/types/route';

export function useCreateRoute() {
  return useMutation({
    mutationFn: (data: RouteCreate) => createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}

export function useUpdateRoute() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RouteCreate }) => updateRoute(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['routes', id] });
    },
  });
}

export function usePatchRoute() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RouteUpdate }) => patchRoute(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['routes', id] });
    },
  });
}

export function useDeleteRoute() {
  return useMutation({
    mutationFn: (id: number) => deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}
