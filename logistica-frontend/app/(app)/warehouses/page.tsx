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
import { WarehouseTable } from '@/components/warehouses/WarehouseTable';
import { WarehouseFilters } from '@/components/warehouses/WarehouseFilters';
import { WarehouseForm } from '@/components/warehouses/WarehouseForm';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useCreateWarehouse, useDeleteWarehouse } from '@/hooks/useWarehouseMutations';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { getApiError } from '@/lib/errorUtils';
import type { Warehouse, WarehouseCreate, WarehouseListParams } from '@/types/warehouse';

const PAGE_SIZE = 20;

export default function WarehousesPage() {
  const router = useRouter();
  const { can } = useUserPermissions();
  const [params, setParams] = useState<WarehouseListParams>({ page: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const { data, isLoading, isError } = useWarehouses(params);
  const createMutation = useCreateWarehouse();
  const deleteMutation = useDeleteWarehouse();

  const currentPage = params.page ?? 1;

  function handleEdit(warehouse: Warehouse) {
    router.push(`/warehouses/${warehouse.id}`);
  }

  function handleDeleteClick(warehouse: Warehouse) {
    setDeleteTarget(warehouse);
  }

  async function handleCreate(formData: WarehouseCreate) {
    try {
      await createMutation.mutateAsync(formData);
      toast.success('Almacén creado');
      setCreateOpen(false);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Almacén eliminado');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  function handleParamsChange(newParams: WarehouseListParams) {
    setParams(newParams);
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Almacenes</h1>
        {can('add_warehouse') && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Nuevo almacén
          </Button>
        )}
      </div>

      {/* Filters */}
      <WarehouseFilters params={params} onChange={handleParamsChange} />

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          Error al cargar almacenes
        </div>
      )}

      {/* Table */}
      <WarehouseTable
        data={data?.results ?? []}
        isLoading={isLoading}
        onEdit={can('change_warehouse') ? handleEdit : undefined}
        onDelete={can('delete_warehouse') ? handleDeleteClick : undefined}
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo almacén</DialogTitle>
          </DialogHeader>
          <WarehouseForm
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar almacén</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar almacén{' '}
            <span className="font-medium text-foreground">{deleteTarget?.name}</span>? Esta
            acción no se puede deshacer.
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
