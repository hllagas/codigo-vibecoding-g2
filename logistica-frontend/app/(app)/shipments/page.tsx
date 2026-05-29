'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShipmentTable } from '@/components/shipments/ShipmentTable';
import { ShipmentFilters } from '@/components/shipments/ShipmentFilters';
import { ShipmentCreateForm } from '@/components/shipments/ShipmentCreateForm';
import { useShipments } from '@/hooks/useShipments';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateShipment, useDeleteShipment } from '@/hooks/useShipmentMutations';
import type { Shipment, ShipmentCreate, ShipmentListParams } from '@/types/shipment';

const PAGE_SIZE = 20;

export default function ShipmentsPage() {
  const router = useRouter();
  const [params, setParams] = useState<ShipmentListParams>({ page: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Shipment | null>(null);

  const { data, isLoading, isError } = useShipments(params);
  const { data: customersData } = useCustomers({ page: 1 });

  const customersMap: Record<number, string> = {};
  customersData?.results.forEach((c) => { customersMap[c.id] = c.name; });

  const createMutation = useCreateShipment();
  const deleteMutation = useDeleteShipment();

  const currentPage = params.page ?? 1;
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;

  async function handleCreate(payload: ShipmentCreate) {
    await createMutation.mutateAsync(payload);
    toast.success('Envío creado');
    setCreateOpen(false);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    toast.success('Envío eliminado');
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Envíos</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Nuevo envío
        </Button>
      </div>

      <ShipmentFilters params={params} onChange={setParams} />

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          Error al cargar envíos
        </div>
      )}

      <ShipmentTable
        data={data?.results ?? []}
        isLoading={isLoading}
        customersMap={customersMap}
        onEdit={(shipment) => router.push(`/shipments/${shipment.id}`)}
        onDelete={setDeleteTarget}
      />

      {data && data.count > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {Math.min((currentPage - 1) * PAGE_SIZE + 1, data.count)}–
            {Math.min(currentPage * PAGE_SIZE, data.count)} de {data.count}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.previous}
              onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
            >
              <ChevronLeft />
              Anterior
            </Button>
            <span>Página {currentPage} de {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.next}
              onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
            >
              Siguiente
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo envío</DialogTitle>
          </DialogHeader>
          <ShipmentCreateForm
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar envío</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar el envío{' '}
            <span className="font-mono font-medium text-foreground">{deleteTarget?.tracking_number}</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
