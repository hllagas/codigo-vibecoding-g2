'use client';

import { useQuery } from '@tanstack/react-query';
import { getCustomer } from '@/services/customerService';

export function useCustomer(id: number | null) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => getCustomer(id!),
    enabled: !!id,
  });
}
