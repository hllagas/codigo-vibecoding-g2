'use client';

import { useQuery } from '@tanstack/react-query';
import { listShipments } from '@/services/shipmentService';
import type { ShipmentListParams } from '@/types/shipment';

export function useShipments(params?: ShipmentListParams) {
  return useQuery({
    queryKey: ['shipments', params],
    queryFn: () => listShipments(params),
  });
}
