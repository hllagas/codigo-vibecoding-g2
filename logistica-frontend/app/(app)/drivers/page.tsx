'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDrivers } from '@/hooks/useDrivers';
import { useCreateDriver, useDeleteDriver } from '@/hooks/useDriverMutations';
import { DriverTable } from '@/components/drivers/DriverTable';
import { DriverFilters } from '@/components/drivers/DriverFilters';
import { DriverForm } from '@/components/drivers/DriverForm';
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
import type { Driver, DriverCreate, DriverListParams } from '@/types/driver';

export default function DriversPage() {
  const router = useRouter();
  const [params, setParams] = useState<DriverListParams>({ page: 1 });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  const { data, isLoading, isError } = useDrivers(params);
  const createMutation = useCreateDriver();
  const deleteMutation = useDeleteDriver();

  function handleEdit(driver: Driver) {
    router.push(`/drivers/${driver.id}`);
  }

  function handleDeleteClick(driver: Driver) {
    setDriverToDelete(driver);
  }

  async function handleDeleteConfirm() {
    if (!driverToDelete) return;
    try {
      await deleteMutation.mutateAsync(driverToDelete.id);
      setDriverToDelete(null);
      toast.success('Conductor eliminado');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleCreate(data: DriverCreate) {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
      toast.success('Conductor creado');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  const driverFullName = driverToDelete
    ? [driverToDelete.user_detail.first_name, driverToDelete.user_detail.last_name]
        .filter(Boolean)
        .join(' ') || driverToDelete.user_detail.username
    : '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conductores</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Nuevo conductor</Button>
      </div>

      <DriverFilters params={params} onChange={setParams} />

      {isError && <p className="text-destructive">Error al cargar conductores</p>}

      <DriverTable
        data={data?.results ?? []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
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
            <DialogTitle>Nuevo conductor</DialogTitle>
          </DialogHeader>
          <DriverForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={driverToDelete !== null}
        onOpenChange={(open) => { if (!open) setDriverToDelete(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar conductor?</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar{' '}
            <strong>{driverFullName}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverToDelete(null)}>
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
