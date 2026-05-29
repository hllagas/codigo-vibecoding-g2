'use client';

import { useQuery } from '@tanstack/react-query';
import { listCustomers } from '@/services/customerService';
import type { CustomerListParams } from '@/types/customer';

export function useCustomers(params?: CustomerListParams) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => listCustomers(params),
  });
}
