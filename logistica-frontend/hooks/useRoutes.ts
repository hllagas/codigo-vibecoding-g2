'use client';

import { useQuery } from '@tanstack/react-query';
import { listRoutes } from '@/services/routeService';
import type { RouteListParams } from '@/types/route';

export function useRoutes(params?: RouteListParams) {
  return useQuery({
    queryKey: ['routes', params],
    queryFn: () => listRoutes(params),
  });
}
