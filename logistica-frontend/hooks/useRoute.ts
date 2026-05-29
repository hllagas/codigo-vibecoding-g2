'use client';

import { useQuery } from '@tanstack/react-query';
import { getRoute } from '@/services/routeService';

export function useRoute(id: number | null) {
  return useQuery({
    queryKey: ['routes', id],
    queryFn: () => getRoute(id!),
    enabled: !!id,
  });
}
