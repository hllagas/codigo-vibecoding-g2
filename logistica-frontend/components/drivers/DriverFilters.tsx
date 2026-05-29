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
import type { DriverListParams } from '@/types/driver';

interface DriverFiltersProps {
  params: DriverListParams;
  onChange: (params: DriverListParams) => void;
}

export function DriverFilters({ params, onChange }: DriverFiltersProps) {
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

  function handleIsAvailableChange(value: string | null) {
    const resolved =
      value === 'true' ? true : value === 'false' ? false : undefined;
    onChange({ ...params, is_available: resolved, page: 1 });
  }

  const hasActiveFilters =
    params.search !== undefined || params.is_available !== undefined;

  const isAvailableValue =
    params.is_available === true
      ? 'true'
      : params.is_available === false
      ? 'false'
      : 'all';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Input
        placeholder="Buscar por licencia o teléfono…"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full sm:w-64"
      />
      <Select value={isAvailableValue} onValueChange={handleIsAvailableChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Disponible</SelectItem>
          <SelectItem value="false">No disponible</SelectItem>
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
