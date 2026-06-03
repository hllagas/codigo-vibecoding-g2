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
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { SupplierFilters } from '@/components/suppliers/SupplierFilters';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCreateSupplier, useDeleteSupplier } from '@/hooks/useSupplierMutations';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { getApiError } from '@/lib/errorUtils';
import type { Supplier, SupplierCreate, SupplierListParams } from '@/types/supplier';

const PAGE_SIZE = 20;

export default function SuppliersPage() {
  const router = useRouter();
  const { can } = useUserPermissions();
  const [params, setParams] = useState<SupplierListParams>({ page: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const { data, isLoading, isError } = useSuppliers(params);
  const createMutation = useCreateSupplier();
  const deleteMutation = useDeleteSupplier();

  const currentPage = params.page ?? 1;

  function handleEdit(supplier: Supplier) {
    router.push(`/suppliers/${supplier.id}`);
  }

  function handleDeleteClick(supplier: Supplier) {
    setDeleteTarget(supplier);
  }

  async function handleCreate(formData: SupplierCreate) {
    try {
      await createMutation.mutateAsync(formData);
      toast.success('Proveedor creado');
      setCreateOpen(false);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Proveedor eliminado');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  function handleParamsChange(newParams: SupplierListParams) {
    setParams(newParams);
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        {can('add_supplier') && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Nuevo proveedor
          </Button>
        )}
      </div>

      {/* Filters */}
      <SupplierFilters params={params} onChange={handleParamsChange} />

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          Error al cargar proveedores
        </div>
      )}

      {/* Table */}
      <SupplierTable
        data={data?.results ?? []}
        isLoading={isLoading}
        onEdit={can('change_supplier') ? handleEdit : undefined}
        onDelete={can('delete_supplier') ? handleDeleteClick : undefined}
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
            <DialogTitle>Nuevo proveedor</DialogTitle>
          </DialogHeader>
          <SupplierForm
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
            <DialogTitle>Eliminar proveedor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar proveedor{' '}
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
