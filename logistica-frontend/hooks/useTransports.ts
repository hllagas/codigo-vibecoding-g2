'use client';

import { useQuery } from '@tanstack/react-query';
import { listTransports } from '@/services/transportService';
import type { TransportListParams } from '@/types/transport';

export function useTransports(params?: TransportListParams) {
  return useQuery({
    queryKey: ['transports', params],
    queryFn: () => listTransports(params),
  });
}
