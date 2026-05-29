'use client';

import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { createRouteStop, updateRouteStop, deleteRouteStop } from '@/services/routeService';
import type { RouteStopCreate } from '@/types/route';

export function useCreateRouteStop(routeId: number) {
  return useMutation({
    mutationFn: (data: RouteStopCreate) => createRouteStop(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-stops', routeId] });
    },
  });
}

export function useUpdateRouteStop(routeId: number) {
  return useMutation({
    mutationFn: ({ stopId, data }: { stopId: number; data: RouteStopCreate }) =>
      updateRouteStop(routeId, stopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-stops', routeId] });
    },
  });
}

export function useDeleteRouteStop(routeId: number) {
  return useMutation({
    mutationFn: (stopId: number) => deleteRouteStop(routeId, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-stops', routeId] });
    },
  });
}
