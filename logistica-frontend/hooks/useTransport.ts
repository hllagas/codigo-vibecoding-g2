'use client';

import { useQuery } from '@tanstack/react-query';
import { getTransport } from '@/services/transportService';

export function useTransport(id: number | null) {
  return useQuery({
    queryKey: ['transports', id],
    queryFn: () => getTransport(id!),
    enabled: !!id,
  });
}
