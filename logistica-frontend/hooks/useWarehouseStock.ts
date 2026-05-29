'use client';

import { useQuery } from '@tanstack/react-query';
import { getWarehouseStock } from '@/services/warehouseService';

export function useWarehouseStock(warehouseId: number | null) {
  return useQuery({
    queryKey: ['warehouses', warehouseId, 'stock'],
    queryFn: () => getWarehouseStock(warehouseId!),
    enabled: !!warehouseId,
  });
}
