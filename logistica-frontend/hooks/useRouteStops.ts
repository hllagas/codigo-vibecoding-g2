'use client';

import { useQuery } from '@tanstack/react-query';
import { listRouteStops } from '@/services/routeService';

export function useRouteStops(routeId: number | null) {
  return useQuery({
    queryKey: ['route-stops', routeId],
    queryFn: () => listRouteStops(routeId!),
    enabled: !!routeId,
  });
}
