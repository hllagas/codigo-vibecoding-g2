'use client';

import { useQuery } from '@tanstack/react-query';
import { listDrivers } from '@/services/driverService';
import type { DriverListParams } from '@/types/driver';

export function useDrivers(params?: DriverListParams) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => listDrivers(params),
  });
}
