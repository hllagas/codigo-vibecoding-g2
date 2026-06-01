'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CustomerTypeBadge } from '@/components/customers/CustomerTypeBadge';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCustomer } from '@/hooks/useCustomer';
import { useUpdateCustomer, useDeleteCustomer } from '@/hooks/useCustomerMutations';
import { getApiError } from '@/lib/errorUtils';
import type { CustomerCreate } from '@/types/customer';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id ? Number(params.id) : null;

  const { data: customer, isLoading, isError } = useCustomer(id);
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleUpdate(formData: CustomerCreate) {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      toast.success('Cliente actualizado');
      setEditMode(false);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeleteConfirm() {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Cliente eliminado');
      router.push('/customers');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error / not found state
  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Link href="/customers" className="text-sm text-primary hover:underline">
          ← Volver a Clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/customers" className="hover:text-foreground transition-colors">
          Clientes
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground font-medium">{customer.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <CustomerTypeBadge type={customer.customer_type} />
            <StatusBadge isActive={customer.is_active} />
          </div>
        </div>
        {!editMode && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditMode(true)}>
              <Pencil />
              Editar
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Eliminar
            </Button>
          </div>
        )}
        {editMode && (
          <Button variant="outline" onClick={() => setEditMode(false)}>
            Cancelar
          </Button>
        )}
      </div>

      <Separator />

      {/* Edit mode: show form */}
      {editMode ? (
        <CustomerForm
          defaultValues={customer}
          onSubmit={handleUpdate}
          isSubmitting={updateMutation.isPending}
        />
      ) : (
        /* View mode: detail card */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField label="Nombre" value={customer.name} />
            <DetailField label="RUC / Tax ID" value={customer.tax_id ?? '—'} />
            <DetailField label="Email" value={customer.email} />
            <DetailField label="Teléfono" value={customer.phone ?? '—'} />
            <DetailField label="Ciudad" value={customer.city} />
            <DetailField label="País" value={customer.country} />
          </div>
          {customer.address && (
            <DetailField label="Dirección" value={customer.address} />
          )}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Creado</span>
              <p>{formatDate(customer.created_at)}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Actualizado</span>
              <p>{formatDate(customer.updated_at)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar cliente{' '}
            <span className="font-medium text-foreground">{customer.name}</span>? Esta
            acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
