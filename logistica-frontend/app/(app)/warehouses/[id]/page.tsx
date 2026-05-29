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
import { WarehouseForm } from '@/components/warehouses/WarehouseForm';
import { WarehouseStockTable } from '@/components/warehouses/WarehouseStockTable';
import { useWarehouse } from '@/hooks/useWarehouse';
import { useWarehouseStock } from '@/hooks/useWarehouseStock';
import { useUpdateWarehouse, useDeleteWarehouse } from '@/hooks/useWarehouseMutations';
import type { WarehouseCreate } from '@/types/warehouse';

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id ? Number(params.id) : null;

  const { data: warehouse, isLoading, isError } = useWarehouse(id);
  const { data: stockData, isLoading: isStockLoading } = useWarehouseStock(id);
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();

  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleUpdate(formData: WarehouseCreate) {
    if (!id) return;
    await updateMutation.mutateAsync({ id, data: formData });
    toast.success('Almacén actualizado');
    setEditMode(false);
  }

  async function handleDeleteConfirm() {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    toast.success('Almacén eliminado');
    router.push('/warehouses');
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-PE', {
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
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error / not found state
  if (isError || !warehouse) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Almacén no encontrado</p>
        <Link href="/warehouses" className="text-sm text-primary hover:underline">
          ← Volver a Almacenes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/warehouses" className="hover:text-foreground transition-colors">
          Almacenes
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground font-medium">{warehouse.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{warehouse.name}</h1>
          <div className="mt-1">
            <StatusBadge isActive={warehouse.is_active} />
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
        <WarehouseForm
          defaultValues={warehouse}
          onSubmit={handleUpdate}
          isSubmitting={updateMutation.isPending}
        />
      ) : (
        /* View mode: detail card */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField label="Nombre" value={warehouse.name} />
            <DetailField label="Capacidad" value={warehouse.capacity.toLocaleString('es-PE')} />
            <DetailField label="Ciudad" value={warehouse.city} />
            <DetailField label="País" value={warehouse.country} />
            <DetailField label="Latitud" value={warehouse.latitude ?? '—'} />
            <DetailField label="Longitud" value={warehouse.longitude ?? '—'} />
          </div>
          <DetailField label="Dirección" value={warehouse.address} />
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Creado</span>
              <p>{formatDate(warehouse.created_at)}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Actualizado</span>
              <p>{formatDate(warehouse.updated_at)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stock sub-section */}
      <div className="space-y-4">
        <Separator />
        <h2 className="text-lg font-semibold">Stock en este almacén</h2>
        <WarehouseStockTable
          data={stockData?.results ?? []}
          isLoading={isStockLoading}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar almacén</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar almacén{' '}
            <span className="font-medium text-foreground">{warehouse.name}</span>? Esta
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
