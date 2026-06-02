'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
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
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { getApiError } from '@/lib/errorUtils';
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

  async function handleCreate(payload: ShipmentCreate) {
    try {
      await createMutation.mutateAsync(payload);
      toast.success('Envío creado');
      setCreateOpen(false);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Envío eliminado');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
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

      {data && (
        <DataTablePagination
          count={data.count}
          page={currentPage}
          hasPrevious={!!data.previous}
          hasNext={!!data.next}
          onPrev={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
          onNext={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
        />
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
