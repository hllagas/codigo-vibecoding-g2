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

  useEffect(() => { setSearchValue(params.search ?? ''); }, [params.search]);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onChange({ ...params, search: value.trim() || undefined, page: 1 });
    }, 300);
  }
  function handleTransportTypeChange(value: string | null) {
    const resolved = value === 'all' || !value ? undefined : (value as TransportType);
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
  function handleClear() { onChange({ page: 1 }); }

  const activeCount = [
    !!params.search, !!params.transport_type, params.is_active !== undefined, params.driver !== undefined,
  ].filter(Boolean).length;

  const transportTypeValue = params.transport_type ?? 'all';
  const isActiveValue = params.is_active === true ? 'true' : params.is_active === false ? 'false' : 'all';
  const driverValue = params.driver !== undefined ? String(params.driver) : 'all';

  const searchInput = (cls: string) => (
    <Input placeholder="Buscar por nombre o matrícula…" value={searchValue}
      onChange={(e) => handleSearchChange(e.target.value)} className={cls} />
  );
  const typeSelect = (cls: string) => (
    <Select value={transportTypeValue} onValueChange={handleTransportTypeChange}>
      <SelectTrigger className={cls}><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los tipos</SelectItem>
        <SelectItem value="truck">Camión</SelectItem>
        <SelectItem value="van">Furgoneta</SelectItem>
        <SelectItem value="motorcycle">Moto</SelectItem>
        <SelectItem value="bicycle">Bicicleta</SelectItem>
      </SelectContent>
    </Select>
  );
  const activeSelect = (cls: string) => (
    <Select value={isActiveValue} onValueChange={handleIsActiveChange}>
      <SelectTrigger className={cls}><SelectValue placeholder="Todos" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        <SelectItem value="true">Activo</SelectItem>
        <SelectItem value="false">Inactivo</SelectItem>
      </SelectContent>
    </Select>
  );
  const driverSelect = (cls: string) => (
    <Select value={driverValue} onValueChange={handleDriverChange}>
      <SelectTrigger className={cls}><SelectValue placeholder="Todos los conductores" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los conductores</SelectItem>
        {drivers.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.license_number}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex flex-wrap gap-2 items-center">
        {searchInput('w-64')}
        {typeSelect('w-44')}
        {activeSelect('w-36')}
        {driverSelect('w-48')}
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
                {typeSelect('w-full')}
                {activeSelect('w-full')}
                {driverSelect('w-full')}
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
