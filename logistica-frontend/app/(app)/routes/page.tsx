'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useRoutes } from '@/hooks/useRoutes';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useTransports } from '@/hooks/useTransports';
import { useCreateRoute, useDeleteRoute } from '@/hooks/useRouteMutations';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { RouteTable } from '@/components/routes/RouteTable';
import { RouteFilters } from '@/components/routes/RouteFilters';
import { RouteForm } from '@/components/routes/RouteForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { getApiError } from '@/lib/errorUtils';
import type { Route, RouteCreate, RouteListParams } from '@/types/route';

export default function RoutesPage() {
  const router = useRouter();
  const { can } = useUserPermissions();
  const [params, setParams] = useState<RouteListParams>({ page: 1 });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  const { data, isLoading, isError } = useRoutes(params);
  const hasActiveFilters = !!(params.search || params.status || params.origin_warehouse !== undefined || params.transport !== undefined);
  const { data: warehousesData } = useWarehouses({ page: 1 });
  const { data: transportsData } = useTransports({ page: 1 });

  const warehousesMap: Record<number, string> = {};
  for (const w of warehousesData?.results ?? []) warehousesMap[w.id] = w.name;
  const transportsMap: Record<number, string> = {};
  for (const t of transportsData?.results ?? []) transportsMap[t.id] = t.name;

  const createMutation = useCreateRoute();
  const deleteMutation = useDeleteRoute();

  function handleEdit(route: Route) {
    router.push(`/routes/${route.id}`);
  }

  function handleDeleteClick(route: Route) {
    setRouteToDelete(route);
  }

  async function handleDeleteConfirm() {
    if (!routeToDelete) return;
    try {
      await deleteMutation.mutateAsync(routeToDelete.id);
      setRouteToDelete(null);
      toast.success('Ruta eliminada');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleCreate(data: RouteCreate) {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
      toast.success('Ruta creada');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rutas</h1>
        {can('add_route') && <Button onClick={() => setIsCreateOpen(true)}>Nueva ruta</Button>}
      </div>

      <RouteFilters params={params} onChange={setParams} />

      {isError && <p className="text-destructive">Error al cargar rutas</p>}

      <RouteTable
        data={data?.results ?? []}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        warehousesMap={warehousesMap}
        transportsMap={transportsMap}
        onEdit={can('change_route') ? handleEdit : undefined}
        onDelete={can('delete_route') ? handleDeleteClick : undefined}
      />

      {data && (
        <DataTablePagination
          count={data.count}
          page={params.page ?? 1}
          hasPrevious={!!data.previous}
          hasNext={!!data.next}
          onPrev={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
          onNext={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
        />
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva ruta</DialogTitle>
          </DialogHeader>
          <RouteForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={routeToDelete !== null}
        onOpenChange={(open) => { if (!open) setRouteToDelete(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar ruta?</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar{' '}
            <strong>{routeToDelete?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRouteToDelete(null)}>
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
