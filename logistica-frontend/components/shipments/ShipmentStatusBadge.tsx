'use client';

import { Badge } from '@/components/ui/badge';
import type { ShipmentStatus } from '@/types/shipment';

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus;
}

const LABELS: Record<ShipmentStatus, string> = {
  pending:    'Pendiente',
  processing: 'Procesando',
  in_transit: 'En tránsito',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
  returned:   'Devuelto',
};

const COLOR_MAP: Record<ShipmentStatus, string> = {
  pending:    'bg-gray-400 text-white',
  processing: 'bg-blue-500 text-white',
  in_transit: 'bg-amber-500 text-white',
  delivered:  'bg-green-500 text-white',
  cancelled:  'bg-red-500 text-white',
  returned:   'bg-orange-500 text-white',
};

export function ShipmentStatusBadge({ status }: ShipmentStatusBadgeProps) {
  return (
    <Badge className={COLOR_MAP[status]}>
      {LABELS[status]}
    </Badge>
  );
}
