'use client';

import { Badge } from '@/components/ui/badge';
import type { RouteStatus } from '@/types/route';

interface RouteStatusBadgeProps {
  status: RouteStatus;
}

const LABELS: Record<RouteStatus, string> = {
  planned: 'Planificada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const COLOR_MAP: Record<RouteStatus, string> = {
  planned: 'bg-blue-500 text-white',
  in_progress: 'bg-amber-500 text-white',
  completed: 'bg-green-500 text-white',
  cancelled: 'bg-red-500 text-white',
};

export function RouteStatusBadge({ status }: RouteStatusBadgeProps) {
  return (
    <Badge className={COLOR_MAP[status]}>
      {LABELS[status]}
    </Badge>
  );
}
