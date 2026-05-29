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
import { useDrivers } from '@/hooks/useDrivers';
import type { TransportListParams, TransportType } from '@/types/transport';

interface TransportFiltersProps {
  params: TransportListParams;
  onChange: (params: TransportListParams) => void;
}

export function TransportFilters({ params, onChange }: TransportFiltersProps) {
  const { data: driversData } = useDrivers({ page: 1 });
  const drivers = driversData?.results ?? [];

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

  function handleTransportTypeChange(value: string | null) {
    const resolved =
      value === 'all' || !value ? undefined : (value as TransportType);
    onChange({ ...params, transport_type: resolved, page: 1 });
  }

  function handleIsActiveChange(value: string | null) {
    const resolved = value === 'true' ? true : value === 'false' ? false : undefined;
    onChange({ ...params, is_active: resolved, page: 1 });
  }

  function handleDriverChange(value: string | null) {
    const resolved = value === 'all' || !value ? undefined : parseInt(value, 10);
    onChange({ ...params, driver: resolved, page: 1 });
  }

  const hasActiveFilters =
    params.search !== undefined ||
    params.transport_type !== undefined ||
    params.is_active !== undefined ||
    params.driver !== undefined;

  const transportTypeValue = params.transport_type ?? 'all';
  const isActiveValue =
    params.is_active === true ? 'true' : params.is_active === false ? 'false' : 'all';
  const driverValue = params.driver !== undefined ? String(params.driver) : 'all';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Input
        placeholder="Buscar por nombre o matrícula…"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full sm:w-64"
      />
      <Select value={transportTypeValue} onValueChange={handleTransportTypeChange}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="truck">Camión</SelectItem>
          <SelectItem value="van">Furgoneta</SelectItem>
          <SelectItem value="motorcycle">Moto</SelectItem>
          <SelectItem value="bicycle">Bicicleta</SelectItem>
        </SelectContent>
      </Select>
      <Select value={isActiveValue} onValueChange={handleIsActiveChange}>
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Activo</SelectItem>
          <SelectItem value="false">Inactivo</SelectItem>
        </SelectContent>
      </Select>
      <Select value={driverValue} onValueChange={handleDriverChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Todos los conductores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los conductores</SelectItem>
          {drivers.map((d) => (
            <SelectItem key={d.id} value={String(d.id)}>
              {d.license_number}
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
