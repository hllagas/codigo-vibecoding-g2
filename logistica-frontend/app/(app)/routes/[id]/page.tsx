'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useRoute } from '@/hooks/useRoute';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useTransports } from '@/hooks/useTransports';
import { useRouteStops } from '@/hooks/useRouteStops';
import { useUpdateRoute, useDeleteRoute } from '@/hooks/useRouteMutations';
import {
  useCreateRouteStop,
  useUpdateRouteStop,
  useDeleteRouteStop,
} from '@/hooks/useRouteStopMutations';
import { RouteForm } from '@/components/routes/RouteForm';
import { RouteStatusBadge } from '@/components/routes/RouteStatusBadge';
import { RouteStopTable } from '@/components/routes/RouteStopTable';
import { RouteStopForm } from '@/components/routes/RouteStopForm';
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
import type { RouteCreate, RouteStop, RouteStopCreate } from '@/types/route';

export default function RouteDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = parseInt(idParam, 10);
  const router = useRouter();

  const { data: route, isLoading, isError } = useRoute(id);
  const { data: warehousesData } = useWarehouses({ page: 1 });
  const { data: transportsData } = useTransports({ page: 1 });
  const { data: stopsData, isLoading: stopsLoading } = useRouteStops(id);

  const warehousesMap: Record<number, string> = {};
  for (const w of warehousesData?.results ?? []) warehousesMap[w.id] = w.name;
  const transportsMap: Record<number, string> = {};
  for (const t of transportsData?.results ?? []) transportsMap[t.id] = t.name;

  const updateMutation = useUpdateRoute();
  const deleteMutation = useDeleteRoute();
  const createStopMutation = useCreateRouteStop(id);
  const updateStopMutation = useUpdateRouteStop(id);
  const deleteStopMutation = useDeleteRouteStop(id);

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStopFormOpen, setIsStopFormOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<RouteStop | null>(null);
  const [stopToDelete, setStopToDelete] = useState<RouteStop | null>(null);

  async function handleUpdate(data: RouteCreate) {
    try {
      await updateMutation.mutateAsync({ id, data });
      setIsEditing(false);
      toast.success('Ruta actualizada');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteMutation.mutateAsync(id);
      router.push('/routes');
      toast.success('Ruta eliminada');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleStopSubmit(data: RouteStopCreate) {
    try {
      if (editingStop) {
        await updateStopMutation.mutateAsync({ stopId: editingStop.id, data });
        toast.success('Parada actualizada');
      } else {
        await createStopMutation.mutateAsync(data);
        toast.success('Parada añadida');
      }
      setIsStopFormOpen(false);
      setEditingStop(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleStopDeleteConfirm() {
    if (!stopToDelete) return;
    try {
      await deleteStopMutation.mutateAsync(stopToDelete.id);
      setStopToDelete(null);
      toast.success('Parada eliminada');
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

  if (isError || !route) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Ruta no encontrada</p>
        <Button variant="link" className="px-0" onClick={() => router.push('/routes')}>
          ← Volver a rutas
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar ruta</h1>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
        <RouteForm
          defaultValues={route}
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
          <Button variant="link" className="px-0" onClick={() => router.push('/routes')}>
            ← Rutas
          </Button>
          <h1 className="text-2xl font-bold">{route.name}</h1>
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
          <dd className="font-medium">{route.name}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Estado</dt>
          <dd><RouteStatusBadge status={route.status} /></dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Almacén origen</dt>
          <dd>{warehousesMap[route.origin_warehouse] ?? `ID ${route.origin_warehouse}`}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Transporte</dt>
          <dd>{transportsMap[route.transport] ?? `ID ${route.transport}`}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Duración estimada</dt>
          <dd>
            {route.estimated_duration_hours !== null
              ? `${parseFloat(route.estimated_duration_hours).toFixed(1)} h`
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Inicio</dt>
          <dd>{route.started_at ? new Date(route.started_at).toLocaleString() : '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Finalización</dt>
          <dd>{route.completed_at ? new Date(route.completed_at).toLocaleString() : '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Creado</dt>
          <dd className="text-sm">{new Date(route.created_at).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Actualizado</dt>
          <dd className="text-sm">{new Date(route.updated_at).toLocaleString()}</dd>
        </div>
      </dl>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Paradas</h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingStop(null);
              setIsStopFormOpen(true);
            }}
          >
            Añadir parada
          </Button>
        </div>
        <RouteStopTable
          data={stopsData ?? []}
          isLoading={stopsLoading}
          onEdit={(stop) => {
            setEditingStop(stop);
            setIsStopFormOpen(true);
          }}
          onDelete={(stop) => setStopToDelete(stop)}
        />
      </div>

      {/* Stop form dialog */}
      <Dialog
        open={isStopFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsStopFormOpen(false);
            setEditingStop(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStop ? 'Editar parada' : 'Nueva parada'}</DialogTitle>
          </DialogHeader>
          <RouteStopForm
            key={editingStop?.id ?? 'new'}
            defaultValues={
              editingStop
                ? {
                    stop_order: editingStop.stop_order,
                    address: editingStop.address,
                    city: editingStop.city,
                    latitude: editingStop.latitude,
                    longitude: editingStop.longitude,
                    estimated_arrival: editingStop.estimated_arrival,
                    actual_arrival: editingStop.actual_arrival,
                  }
                : undefined
            }
            onSubmit={handleStopSubmit}
            isSubmitting={createStopMutation.isPending || updateStopMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Stop delete confirm */}
      <Dialog
        open={stopToDelete !== null}
        onOpenChange={(open) => { if (!open) setStopToDelete(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar parada?</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar la parada{' '}
            <strong>#{stopToDelete?.stop_order} — {stopToDelete?.address}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStopToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteStopMutation.isPending}
              onClick={handleStopDeleteConfirm}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Route delete confirm */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar ruta?</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar <strong>{route.name}</strong>? Esta acción no se
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
