'use client';

import { useQuery } from '@tanstack/react-query';
import { getShipment } from '@/services/shipmentService';

export function useShipment(id: number | null) {
  return useQuery({
    queryKey: ['shipments', id],
    queryFn: () => getShipment(id!),
    enabled: !!id,
  });
}
