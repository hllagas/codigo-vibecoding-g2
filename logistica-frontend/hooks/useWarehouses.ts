'use client';

import { useQuery } from '@tanstack/react-query';
import { listWarehouses } from '@/services/warehouseService';
import type { WarehouseListParams } from '@/types/warehouse';

export function useWarehouses(params?: WarehouseListParams) {
  return useQuery({
    queryKey: ['warehouses', params],
    queryFn: () => listWarehouses(params),
  });
}
