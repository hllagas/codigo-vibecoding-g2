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
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateCustomer, useDeleteCustomer } from '@/hooks/useCustomerMutations';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { getApiError } from '@/lib/errorUtils';
import type { Customer, CustomerCreate, CustomerListParams } from '@/types/customer';

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const router = useRouter();
  const { can } = useUserPermissions();
  const [params, setParams] = useState<CustomerListParams>({ page: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const { data, isLoading, isError } = useCustomers(params);
  const createMutation = useCreateCustomer();
  const deleteMutation = useDeleteCustomer();

  const currentPage = params.page ?? 1;

  function handleEdit(customer: Customer) {
    router.push(`/customers/${customer.id}`);
  }

  function handleDeleteClick(customer: Customer) {
    setDeleteTarget(customer);
  }

  async function handleCreate(formData: CustomerCreate) {
    try {
      await createMutation.mutateAsync(formData);
      toast.success('Cliente creado');
      setCreateOpen(false);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Cliente eliminado');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  function handleParamsChange(newParams: CustomerListParams) {
    setParams(newParams);
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        {can('add_customer') && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Nuevo cliente
          </Button>
        )}
      </div>

      {/* Filters */}
      <CustomerFilters params={params} onChange={handleParamsChange} />

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          Error al cargar clientes
        </div>
      )}

      {/* Table */}
      <CustomerTable
        data={data?.results ?? []}
        isLoading={isLoading}
        onEdit={can('change_customer') ? handleEdit : undefined}
        onDelete={can('delete_customer') ? handleDeleteClick : undefined}
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
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>
          <CustomerForm
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
            <DialogTitle>Eliminar cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar cliente{' '}
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
