'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTransports } from '@/hooks/useTransports';
import { useCreateTransport, useDeleteTransport } from '@/hooks/useTransportMutations';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { TransportTable } from '@/components/transports/TransportTable';
import { TransportFilters } from '@/components/transports/TransportFilters';
import { TransportForm } from '@/components/transports/TransportForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { getApiError } from '@/lib/errorUtils';
import type { Transport, TransportCreate, TransportListParams } from '@/types/transport';

export default function TransportsPage() {
  const router = useRouter();
  const { can } = useUserPermissions();
  const [params, setParams] = useState<TransportListParams>({ page: 1 });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [transportToDelete, setTransportToDelete] = useState<Transport | null>(null);

  const { data, isLoading, isError } = useTransports(params);
  const createMutation = useCreateTransport();
  const deleteMutation = useDeleteTransport();

  function handleEdit(transport: Transport) {
    router.push(`/transports/${transport.id}`);
  }

  function handleDeleteClick(transport: Transport) {
    setTransportToDelete(transport);
  }

  async function handleDeleteConfirm() {
    if (!transportToDelete) return;
    try {
      await deleteMutation.mutateAsync(transportToDelete.id);
      setTransportToDelete(null);
      toast.success('Transporte eliminado');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleCreate(data: TransportCreate) {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
      toast.success('Transporte creado');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transportes</h1>
        {can('add_transport') && <Button onClick={() => setIsCreateOpen(true)}>Nuevo transporte</Button>}
      </div>

      <TransportFilters params={params} onChange={setParams} />

      {isError && <p className="text-destructive">Error al cargar transportes</p>}

      <TransportTable
        data={data?.results ?? []}
        isLoading={isLoading}
        onEdit={can('change_transport') ? handleEdit : undefined}
        onDelete={can('delete_transport') ? handleDeleteClick : undefined}
      />

      {data && (
        <DataTablePagination
          count={data.count}
          page={params.page ?? 1}
          hasPrevious={!!data.previous}
          hasNext={!!data.next}
          onPrev={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
          onNext={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
        />
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo transporte</DialogTitle>
          </DialogHeader>
          <TransportForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={transportToDelete !== null}
        onOpenChange={(open) => { if (!open) setTransportToDelete(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar transporte?</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar{' '}
            <strong>{transportToDelete?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransportToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
