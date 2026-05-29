'use client';

import { Badge } from '@/components/ui/badge';

interface DriverAvailabilityBadgeProps {
  isAvailable: boolean;
}

export function DriverAvailabilityBadge({ isAvailable }: DriverAvailabilityBadgeProps) {
  if (isAvailable) {
    return <Badge className="bg-green-500 text-white">Disponible</Badge>;
  }
  return <Badge variant="secondary">No disponible</Badge>;
}
