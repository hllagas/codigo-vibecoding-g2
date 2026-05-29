'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  useEffect(() => {
    setSearchValue(params.search ?? '');
  }, [params.search]);

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

  const hasActiveFilters =
    params.search !== undefined ||
    params.status !== undefined ||
    params.customer !== undefined ||
    params.origin_warehouse !== undefined ||
    params.route !== undefined;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Input
        placeholder="Buscar por seguimiento, ciudad…"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full sm:w-64"
      />
      <Select value={params.status ?? 'all'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
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
      <Select
        value={params.customer !== undefined ? String(params.customer) : 'all'}
        onValueChange={handleCustomerChange}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Todos los clientes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los clientes</SelectItem>
          {customersData?.results.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.origin_warehouse !== undefined ? String(params.origin_warehouse) : 'all'}
        onValueChange={handleWarehouseChange}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Todos los almacenes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los almacenes</SelectItem>
          {warehousesData?.results.map((w) => (
            <SelectItem key={w.id} value={String(w.id)}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.route !== undefined ? String(params.route) : 'all'}
        onValueChange={handleRouteChange}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Todas las rutas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las rutas</SelectItem>
          {routesData?.results.map((r) => (
            <SelectItem key={r.id} value={String(r.id)}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button variant="outline" onClick={() => onChange({ page: 1 })}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
