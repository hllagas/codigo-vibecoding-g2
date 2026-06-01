'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDriver } from '@/hooks/useDriver';
import { useUpdateDriver, useDeleteDriver } from '@/hooks/useDriverMutations';
import { DriverForm } from '@/components/drivers/DriverForm';
import { DriverAvailabilityBadge } from '@/components/drivers/DriverAvailabilityBadge';
import { LicenseExpiryBadge } from '@/components/drivers/LicenseExpiryBadge';
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
import { getApiError } from '@/lib/errorUtils';
import type { DriverCreate } from '@/types/driver';

export default function DriverDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = parseInt(idParam, 10);
  const router = useRouter();

  const { data: driver, isLoading, isError } = useDriver(id);
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function handleUpdate(data: DriverCreate) {
    try {
      await updateMutation.mutateAsync({ id, data });
      setIsEditing(false);
      toast.success('Conductor actualizado');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteMutation.mutateAsync(id);
      router.push('/drivers');
      toast.success('Conductor eliminado');
    } catch (err) {
      toast.error(getApiError(err));
    }
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

  if (isError || !driver) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Conductor no encontrado</p>
        <Button variant="link" className="px-0" onClick={() => router.push('/drivers')}>
          ← Volver a conductores
        </Button>
      </div>
    );
  }

  const fullName =
    [driver.user_detail.first_name, driver.user_detail.last_name]
      .filter(Boolean)
      .join(' ') || driver.user_detail.username;

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar conductor</h1>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
        <DriverForm
          defaultValues={{
            user: driver.user,
            license_number: driver.license_number,
            license_expiry: driver.license_expiry,
            phone: driver.phone,
            is_available: driver.is_available,
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
          <Button variant="link" className="px-0" onClick={() => router.push('/drivers')}>
            ← Conductores
          </Button>
          <h1 className="text-2xl font-bold">{fullName}</h1>
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
          <dt className="text-sm text-muted-foreground">Nombre completo</dt>
          <dd className="font-medium">{fullName}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Usuario</dt>
          <dd>{driver.user_detail.username}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd>{driver.user_detail.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Teléfono</dt>
          <dd>{driver.phone}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">N° Licencia</dt>
          <dd className="font-medium">{driver.license_number}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Vencimiento licencia</dt>
          <dd>
            <LicenseExpiryBadge dateStr={driver.license_expiry} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Disponibilidad</dt>
          <dd>
            <DriverAvailabilityBadge isAvailable={driver.is_available} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Creado</dt>
          <dd className="text-sm">{new Date(driver.created_at).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Actualizado</dt>
          <dd className="text-sm">{new Date(driver.updated_at).toLocaleString()}</dd>
        </div>
      </dl>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar conductor?</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar <strong>{fullName}</strong>? Esta acción no se
            puede deshacer.
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
