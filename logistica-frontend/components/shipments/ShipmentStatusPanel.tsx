'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShipmentStatusBadge } from './ShipmentStatusBadge';
import { SHIPMENT_VALID_TRANSITIONS } from '@/types/shipment';
import type { ShipmentStatus } from '@/types/shipment';

interface ShipmentStatusPanelProps {
  currentStatus: ShipmentStatus;
  isPending: boolean;
  onTransition: (newStatus: ShipmentStatus) => void;
}

const TRANSITION_LABELS: Partial<Record<ShipmentStatus, string>> = {
  processing: 'Procesar',
  in_transit: 'Enviar',
  delivered:  'Marcar entregado',
  cancelled:  'Cancelar',
  returned:   'Marcar devuelto',
};

export function ShipmentStatusPanel({ currentStatus, isPending, onTransition }: ShipmentStatusPanelProps) {
  const validNextStatuses = SHIPMENT_VALID_TRANSITIONS[currentStatus];
  const isFinal = validNextStatuses.length === 0;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Estado actual:</span>
        <ShipmentStatusBadge status={currentStatus} />
      </div>
      {isFinal ? (
        <p className="text-sm text-muted-foreground">
          Estado final — no se permiten más transiciones.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {validNextStatuses.map((nextStatus) => (
            <Button
              key={nextStatus}
              variant={
                nextStatus === 'cancelled' || nextStatus === 'returned'
                  ? 'destructive'
                  : 'default'
              }
              size="sm"
              disabled={isPending}
              onClick={() => onTransition(nextStatus)}
            >
              {isPending && <Loader2 className="mr-2 size-3 animate-spin" />}
              {TRANSITION_LABELS[nextStatus]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
