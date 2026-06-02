'use client';

import { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { useCustomers } from '@/hooks/useCustomers';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useRoutes } from '@/hooks/useRoutes';
import type { ShipmentListParams, ShipmentStatus } from '@/types/shipment';

interface ShipmentFiltersProps {
  params: ShipmentListParams;
  onChange: (params: ShipmentListParams) => void;
}

export function ShipmentFilters({ params, onChange }: ShipmentFiltersProps) {
  const { data: customersData } = useCustomers({ page: 1 });
  const { data: warehousesData } = useWarehouses({ page: 1 });
  const { data: routesData } = useRoutes({ page: 1 });

  const [searchValue, setSearchValue] = useState(params.search ?? '');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setSearchValue(params.search ?? ''); }, [params.search]);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onChange({ ...params, search: value.trim() || undefined, page: 1 });
    }, 300);
  }
  function handleStatusChange(value: string | null) {
    const resolved = value === 'all' || !value ? undefined : (value as ShipmentStatus);
    onChange({ ...params, status: resolved, page: 1 });
  }
  function handleCustomerChange(value: string | null) {
    const resolved = value === 'all' || !value ? undefined : parseInt(value, 10);
    onChange({ ...params, customer: resolved, page: 1 });
  }
  function handleWarehouseChange(value: string | null) {
    const resolved = value === 'all' || !value ? undefined : parseInt(value, 10);
    onChange({ ...params, origin_warehouse: resolved, page: 1 });
  }
  function handleRouteChange(value: string | null) {
    const resolved = value === 'all' || !value ? undefined : parseInt(value, 10);
    onChange({ ...params, route: resolved, page: 1 });
  }
  function handleClear() { onChange({ page: 1 }); }

  const activeCount = [
    !!params.search, !!params.status, params.customer !== undefined,
    params.origin_warehouse !== undefined, params.route !== undefined,
  ].filter(Boolean).length;

  const searchInput = (cls: string) => (
    <Input placeholder="Buscar por seguimiento, ciudad…" value={searchValue}
      onChange={(e) => handleSearchChange(e.target.value)} className={cls} />
  );
  const statusSelect = (cls: string) => (
    <Select value={params.status ?? 'all'} onValueChange={handleStatusChange}>
      <SelectTrigger className={cls}><SelectValue placeholder="Todos los estados" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los estados</SelectItem>
        <SelectItem value="pending">Pendiente</SelectItem>
        <SelectItem value="processing">Procesando</SelectItem>
        <SelectItem value="in_transit">En tránsito</SelectItem>
        <SelectItem value="delivered">Entregado</SelectItem>
        <SelectItem value="cancelled">Cancelado</SelectItem>
        <SelectItem value="returned">Devuelto</SelectItem>
      </SelectContent>
    </Select>
  );
  const customerSelect = (cls: string) => (
    <Select value={params.customer !== undefined ? String(params.customer) : 'all'} onValueChange={handleCustomerChange}>
      <SelectTrigger className={cls}><SelectValue placeholder="Todos los clientes" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los clientes</SelectItem>
        {customersData?.results.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
  const warehouseSelect = (cls: string) => (
    <Select value={params.origin_warehouse !== undefined ? String(params.origin_warehouse) : 'all'} onValueChange={handleWarehouseChange}>
      <SelectTrigger className={cls}><SelectValue placeholder="Todos los almacenes" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los almacenes</SelectItem>
        {warehousesData?.results.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
  const routeSelect = (cls: string) => (
    <Select value={params.route !== undefined ? String(params.route) : 'all'} onValueChange={handleRouteChange}>
      <SelectTrigger className={cls}><SelectValue placeholder="Todas las rutas" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las rutas</SelectItem>
        {routesData?.results.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex flex-wrap gap-2 items-center">
        {searchInput('w-64')}
        {statusSelect('w-44')}
        {customerSelect('w-48')}
        {warehouseSelect('w-48')}
        {routeSelect('w-48')}
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Mobile sheet */}
      <div className="sm:hidden flex items-center gap-2">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 h-4 text-xs">{activeCount}</Badge>
            )}
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <SheetBody>
              <div className="flex flex-col gap-3">
                {searchInput('w-full')}
                {statusSelect('w-full')}
                {customerSelect('w-full')}
                {warehouseSelect('w-full')}
                {routeSelect('w-full')}
              </div>
            </SheetBody>
            {activeCount > 0 && (
              <SheetFooter>
                <Button variant="outline" className="w-full gap-2" onClick={handleClear}>
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
        {activeCount > 0 && (
          <span className="text-xs text-muted-foreground">{activeCount} activo{activeCount !== 1 ? 's' : ''}</span>
        )}
      </div>
    </>
  );
}
