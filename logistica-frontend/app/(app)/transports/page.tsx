'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTransports } from '@/hooks/useTransports';
import { useCreateTransport, useDeleteTransport } from '@/hooks/useTransportMutations';
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
import type { Transport, TransportCreate, TransportListParams } from '@/types/transport';

const PAGE_SIZE = 20;

export default function TransportsPage() {
  const router = useRouter();
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
    await deleteMutation.mutateAsync(transportToDelete.id);
    setTransportToDelete(null);
    toast.success('Transporte eliminado');
  }

  async function handleCreate(data: TransportCreate) {
    await createMutation.mutateAsync(data);
    setIsCreateOpen(false);
    toast.success('Transporte creado');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transportes</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Nuevo transporte</Button>
      </div>

      <TransportFilters params={params} onChange={setParams} />

      {isError && <p className="text-destructive">Error al cargar transportes</p>}

      <TransportTable
        data={data?.results ?? []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Página {params.page ?? 1} de {Math.ceil((data?.count ?? 0) / PAGE_SIZE) || 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={(params.page ?? 1) <= 1}
            onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data?.next === null}
            onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
          >
            Siguiente
          </Button>
        </div>
      </div>

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
