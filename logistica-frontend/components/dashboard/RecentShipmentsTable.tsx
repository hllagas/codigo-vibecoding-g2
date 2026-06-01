'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useShipmentsBulk } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DashboardFiltersState } from '@/types/dashboard';
import type { ShipmentStatus } from '@/types/shipment';

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  in_transit: 'En tránsito',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  returned: 'Devuelto',
};

const STATUS_STYLE: Record<ShipmentStatus, string> = {
  pending: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  processing: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  in_transit: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  delivered: 'bg-emerald-500/15 text-emerald-400 dark:text-green-400 border-emerald-500/20',
  cancelled: 'bg-red-400/15 text-red-400 border-red-400/20',
  returned: 'bg-orange-400/15 text-orange-400 border-orange-400/20',
};

function getPriority(scheduledDate: string, status: ShipmentStatus): { label: string; style: string } {
  if (status === 'delivered' || status === 'cancelled' || status === 'returned') {
    return { label: 'Finalizado', style: 'text-muted-foreground' };
  }
  const days = Math.ceil((new Date(scheduledDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: 'Atrasado', style: 'text-red-400 font-semibold' };
  if (days <= 2) return { label: 'Urgente', style: 'text-amber-500 font-semibold' };
  if (days <= 7) return { label: 'Normal', style: 'text-blue-400' };
  return { label: 'Baja', style: 'text-muted-foreground' };
}

const PAGE_SIZE = 8;

interface RecentShipmentsTableProps {
  filters: DashboardFiltersState;
}

export function RecentShipmentsTable({ filters }: RecentShipmentsTableProps) {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = useShipmentsBulk(filters.dateFrom, filters.dateTo);

  const sorted = useMemo(() => {
    const results = data?.results ?? [];
    return [...results].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [data]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const rows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card/80 dark:bg-zinc-900/60 backdrop-blur-sm p-5 shadow-sm space-y-3">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border bg-card/80 dark:bg-zinc-900/60 backdrop-blur-sm p-5 shadow-sm">
        <p className="text-sm text-destructive">No se pudo cargar envíos recientes</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card/80 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <h3 className="text-sm font-semibold">Envíos recientes</h3>
        <Link
          href="/shipments"
          className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 hover:underline cursor-pointer"
        >
          Ver todos <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                Código
              </th>
              <th className="hidden sm:table-cell text-left px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                Origen
              </th>
              <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                Destino
              </th>
              <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                Entrega prevista
              </th>
              <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                Estado
              </th>
              <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                Prioridad
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No hay envíos en el período seleccionado
                </td>
              </tr>
            ) : (
              rows.map((shipment) => {
                const priority = getPriority(shipment.scheduled_delivery_date, shipment.status);
                return (
                  <tr
                    key={shipment.id}
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors duration-150 cursor-pointer group"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/shipments/${shipment.id}`}
                        className="font-mono text-xs text-blue-500 dark:text-blue-400 group-hover:underline"
                      >
                        {shipment.tracking_number}
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      WH-{shipment.origin_warehouse}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      <span className="font-medium">{shipment.destination_city}</span>
                      <span className="text-muted-foreground">, {shipment.destination_country}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                      {new Date(shipment.scheduled_delivery_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                          STATUS_STYLE[shipment.status],
                        )}
                      >
                        {STATUS_LABEL[shipment.status]}
                      </span>
                    </td>
                    <td className={cn('px-3 py-3 text-xs whitespace-nowrap', priority.style)}>
                      {priority.label}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
          <span className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md p-1.5 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md p-1.5 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
              aria-label="Página siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
