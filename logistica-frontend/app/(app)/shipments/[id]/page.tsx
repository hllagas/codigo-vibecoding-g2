'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useShipment } from '@/hooks/useShipment';
import { useCustomers } from '@/hooks/useCustomers';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useRoutes } from '@/hooks/useRoutes';
import { useProducts } from '@/hooks/useProducts';
import { useUpdateShipment, useDeleteShipment, useUpdateShipmentStatus } from '@/hooks/useShipmentMutations';
import { ShipmentEditForm } from '@/components/shipments/ShipmentEditForm';
import { ShipmentStatusBadge } from '@/components/shipments/ShipmentStatusBadge';
import { ShipmentStatusPanel } from '@/components/shipments/ShipmentStatusPanel';
import { ShipmentItemsTable } from '@/components/shipments/ShipmentItemsTable';
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
import type { ShipmentStatus, ShipmentUpdate } from '@/types/shipment';

export default function ShipmentDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = parseInt(idParam, 10);
  const router = useRouter();

  const { data: shipment, isLoading, isError } = useShipment(id);
  const { data: customersData } = useCustomers({ page: 1 });
  const { data: warehousesData } = useWarehouses({ page: 1 });
  const { data: routesData } = useRoutes({ page: 1 });
  const { data: productsData } = useProducts({ page: 1 });

  const customersMap: Record<number, string> = {};
  customersData?.results.forEach((c) => { customersMap[c.id] = c.name; });
  const warehousesMap: Record<number, string> = {};
  warehousesData?.results.forEach((w) => { warehousesMap[w.id] = w.name; });
  const routesMap: Record<number, string> = {};
  routesData?.results.forEach((r) => { routesMap[r.id] = r.name; });
  const productsMap: Record<number, string> = {};
  productsData?.results.forEach((p) => { productsMap[p.id] = p.name; });

  const updateMutation = useUpdateShipment();
  const deleteMutation = useDeleteShipment();
  const statusMutation = useUpdateShipmentStatus();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function handleUpdate(data: ShipmentUpdate) {
    try {
      await updateMutation.mutateAsync({ id, data });
      setIsEditing(false);
      toast.success('Envío actualizado');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleStatusTransition(newStatus: ShipmentStatus) {
    try {
      await statusMutation.mutateAsync({ id, status: newStatus });
      toast.success('Estado actualizado');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteMutation.mutateAsync(id);
      router.push('/shipments');
      toast.success('Envío eliminado');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (isError || !shipment) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Envío no encontrado</p>
        <Button variant="link" className="px-0" onClick={() => router.push('/shipments')}>
          ← Volver a envíos
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar envío</h1>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
        <ShipmentEditForm
          defaultValues={shipment}
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
          <Button variant="link" className="px-0" onClick={() => router.push('/shipments')}>
            ← Envíos
          </Button>
          <h1 className="text-2xl font-bold font-mono">{shipment.tracking_number}</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditing(true)}>Editar</Button>
          <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            Eliminar
          </Button>
        </div>
      </div>

      <ShipmentStatusPanel
        currentStatus={shipment.status}
        isPending={statusMutation.isPending}
        onTransition={handleStatusTransition}
      />

      <Separator />

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted-foreground">N° Seguimiento</dt>
          <dd className="font-medium font-mono">{shipment.tracking_number}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Estado</dt>
          <dd><ShipmentStatusBadge status={shipment.status} /></dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Cliente</dt>
          <dd>{customersMap[shipment.customer] ?? `ID ${shipment.customer}`}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Almacén origen</dt>
          <dd>{warehousesMap[shipment.origin_warehouse] ?? `ID ${shipment.origin_warehouse}`}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Ruta</dt>
          <dd>{shipment.route != null ? (routesMap[shipment.route] ?? `ID ${shipment.route}`) : '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Peso total</dt>
          <dd>{parseFloat(shipment.total_weight_kg).toFixed(2)} kg</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Dirección destino</dt>
          <dd>{shipment.destination_address}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Ciudad / País</dt>
          <dd>{shipment.destination_city}, {shipment.destination_country}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Entrega programada</dt>
          <dd>{shipment.scheduled_delivery_date}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Entrega real</dt>
          <dd>{shipment.actual_delivery_date ?? '—'}</dd>
        </div>
        {shipment.notes && (
          <div className="md:col-span-2">
            <dt className="text-sm text-muted-foreground">Notas</dt>
            <dd>{shipment.notes}</dd>
          </div>
        )}
        <div>
          <dt className="text-sm text-muted-foreground">Creado</dt>
          <dd className="text-sm">{new Date(shipment.created_at).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Actualizado</dt>
          <dd className="text-sm">{new Date(shipment.updated_at).toLocaleString()}</dd>
        </div>
      </dl>

      <Separator />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Productos</h2>
        <ShipmentItemsTable items={shipment.items} productsMap={productsMap} />
      </div>

      {/* Delete confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar envío?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar el envío{' '}
            <span className="font-mono font-medium text-foreground">{shipment.tracking_number}</span>?
            Esta acción no se puede deshacer.
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
              {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
