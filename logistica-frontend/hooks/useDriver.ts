'use client';

import { useQuery } from '@tanstack/react-query';
import { getDriver } from '@/services/driverService';

export function useDriver(id: number | null) {
  return useQuery({
    queryKey: ['drivers', id],
    queryFn: () => getDriver(id!),
    enabled: !!id,
  });
}
