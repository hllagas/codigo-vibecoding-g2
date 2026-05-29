'use client';

import { useQuery } from '@tanstack/react-query';
import { getWarehouse } from '@/services/warehouseService';

export function useWarehouse(id: number | null) {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => getWarehouse(id!),
    enabled: !!id,
  });
}
