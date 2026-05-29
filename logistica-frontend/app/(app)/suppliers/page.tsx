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
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { SupplierFilters } from '@/components/suppliers/SupplierFilters';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCreateSupplier, useDeleteSupplier } from '@/hooks/useSupplierMutations';
import type { Supplier, SupplierCreate, SupplierListParams } from '@/types/supplier';

const PAGE_SIZE = 20;

export default function SuppliersPage() {
  const router = useRouter();
  const [params, setParams] = useState<SupplierListParams>({ page: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const { data, isLoading, isError } = useSuppliers(params);
  const createMutation = useCreateSupplier();
  const deleteMutation = useDeleteSupplier();

  const currentPage = params.page ?? 1;
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;

  function handleEdit(supplier: Supplier) {
    router.push(`/suppliers/${supplier.id}`);
  }

  function handleDeleteClick(supplier: Supplier) {
    setDeleteTarget(supplier);
  }

  async function handleCreate(formData: SupplierCreate) {
    await createMutation.mutateAsync(formData);
    toast.success('Proveedor creado');
    setCreateOpen(false);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    toast.success('Proveedor eliminado');
    setDeleteTarget(null);
  }

  function handleParamsChange(newParams: SupplierListParams) {
    setParams(newParams);
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Nuevo proveedor
        </Button>
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
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Pagination */}
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
            <span>
              Página {currentPage} de {totalPages}
            </span>
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
