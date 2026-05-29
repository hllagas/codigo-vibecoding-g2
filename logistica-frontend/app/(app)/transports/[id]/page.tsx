'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTransport } from '@/hooks/useTransport';
import { useUpdateTransport, useDeleteTransport } from '@/hooks/useTransportMutations';
import { TransportForm } from '@/components/transports/TransportForm';
import { TransportTypeBadge } from '@/components/transports/TransportTypeBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { TransportCreate } from '@/types/transport';

export default function TransportDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = parseInt(idParam, 10);
  const router = useRouter();

  const { data: transport, isLoading, isError } = useTransport(id);
  const updateMutation = useUpdateTransport();
  const deleteMutation = useDeleteTransport();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function handleUpdate(data: TransportCreate) {
    await updateMutation.mutateAsync({ id, data });
    setIsEditing(false);
    toast.success('Transporte actualizado');
  }

  async function handleDeleteConfirm() {
    await deleteMutation.mutateAsync(id);
    router.push('/transports');
    toast.success('Transporte eliminado');
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (isError || !transport) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Transporte no encontrado</p>
        <Button variant="link" className="px-0" onClick={() => router.push('/transports')}>
          ← Volver a transportes
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar transporte</h1>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
        <TransportForm
          defaultValues={{
            name: transport.name,
            plate_number: transport.plate_number,
            transport_type: transport.transport_type,
            capacity_kg: transport.capacity_kg,
            driver: transport.driver,
            is_active: transport.is_active,
          }}
          onSubmit={handleUpdate}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="link" className="px-0" onClick={() => router.push('/transports')}>
            ← Transportes
          </Button>
          <h1 className="text-2xl font-bold">{transport.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditing(true)}>Editar</Button>
          <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            Eliminar
          </Button>
        </div>
      </div>

      <Separator />

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted-foreground">Nombre</dt>
          <dd className="font-medium">{transport.name}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Matrícula</dt>
          <dd className="font-medium">{transport.plate_number}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Tipo</dt>
          <dd>
            <TransportTypeBadge transportType={transport.transport_type} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Capacidad</dt>
          <dd>{parseFloat(transport.capacity_kg).toFixed(2)} kg</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Estado</dt>
          <dd>
            <StatusBadge isActive={transport.is_active} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Conductor (licencia)</dt>
          <dd>{transport.driver_detail !== null ? transport.driver_detail.license_number : '—'}</dd>
        </div>
        {transport.driver_detail !== null && (
          <>
            <div>
              <dt className="text-sm text-muted-foreground">Teléfono conductor</dt>
              <dd>{transport.driver_detail.phone}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Conductor disponible</dt>
              <dd>{transport.driver_detail.is_available ? 'Sí' : 'No'}</dd>
            </div>
          </>
        )}
        <div>
          <dt className="text-sm text-muted-foreground">Creado</dt>
          <dd className="text-sm">{new Date(transport.created_at).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Actualizado</dt>
          <dd className="text-sm">{new Date(transport.updated_at).toLocaleString()}</dd>
        </div>
      </dl>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar transporte?</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar <strong>{transport.name}</strong>? Esta acción no
            se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
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
