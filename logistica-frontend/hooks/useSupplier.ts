'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupplier } from '@/services/supplierService';

export function useSupplier(id: number | null) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => getSupplier(id!),
    enabled: !!id,
  });
}
