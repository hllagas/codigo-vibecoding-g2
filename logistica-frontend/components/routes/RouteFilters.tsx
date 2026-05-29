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
import { useWarehouses } from '@/hooks/useWarehouses';
import { useTransports } from '@/hooks/useTransports';
import type { RouteListParams, RouteStatus } from '@/types/route';

interface RouteFiltersProps {
  params: RouteListParams;
  onChange: (params: RouteListParams) => void;
}

export function RouteFilters({ params, onChange }: RouteFiltersProps) {
  const { data: warehousesData } = useWarehouses({ page: 1 });
  const warehouses = warehousesData?.results ?? [];
  const { data: transportsData } = useTransports({ page: 1 });
  const transports = transportsData?.results ?? [];

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
    const resolved = value === 'all' || !value ? undefined : (value as RouteStatus);
    onChange({ ...params, status: resolved, page: 1 });
  }

  function handleWarehouseChange(value: string | null) {
    const resolved = value === 'all' || !value ? undefined : parseInt(value, 10);
    onChange({ ...params, origin_warehouse: resolved, page: 1 });
  }

  function handleTransportChange(value: string | null) {
    const resolved = value === 'all' || !value ? undefined : parseInt(value, 10);
    onChange({ ...params, transport: resolved, page: 1 });
  }

  const hasActiveFilters =
    params.search !== undefined ||
    params.status !== undefined ||
    params.origin_warehouse !== undefined ||
    params.transport !== undefined;

  const statusValue = params.status ?? 'all';
  const warehouseValue = params.origin_warehouse !== undefined ? String(params.origin_warehouse) : 'all';
  const transportValue = params.transport !== undefined ? String(params.transport) : 'all';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Input
        placeholder="Buscar por nombre…"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full sm:w-56"
      />
      <Select value={statusValue} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="planned">Planificada</SelectItem>
          <SelectItem value="in_progress">En progreso</SelectItem>
          <SelectItem value="completed">Completada</SelectItem>
          <SelectItem value="cancelled">Cancelada</SelectItem>
        </SelectContent>
      </Select>
      <Select value={warehouseValue} onValueChange={handleWarehouseChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Todos los almacenes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los almacenes</SelectItem>
          {warehouses.map((w) => (
            <SelectItem key={w.id} value={String(w.id)}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={transportValue} onValueChange={handleTransportChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Todos los transportes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los transportes</SelectItem>
          {transports.map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>
              {t.name}
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
