'use client';

import { Badge } from '@/components/ui/badge';
import type { TransportType } from '@/types/transport';

interface TransportTypeBadgeProps {
  transportType: TransportType;
}

const LABELS: Record<TransportType, string> = {
  truck: 'Camión',
  van: 'Furgoneta',
  motorcycle: 'Moto',
  bicycle: 'Bicicleta',
};

const COLOR_MAP: Record<TransportType, string> = {
  truck: 'bg-blue-500 text-white',
  van: 'bg-purple-500 text-white',
  motorcycle: 'bg-orange-500 text-white',
  bicycle: 'bg-green-500 text-white',
};

export function TransportTypeBadge({ transportType }: TransportTypeBadgeProps) {
  return (
    <Badge className={COLOR_MAP[transportType]}>
      {LABELS[transportType]}
    </Badge>
  );
}
