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
import type { DriverListParams } from '@/types/driver';

interface DriverFiltersProps {
  params: DriverListParams;
  onChange: (params: DriverListParams) => void;
}

export function DriverFilters({ params, onChange }: DriverFiltersProps) {
  const [searchValue, setSearchValue] = useState(params.search ?? '');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => { setSearchValue(params.search ?? ''); }, [params.search]);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onChange({ ...paramsRef.current, search: value.trim() || undefined, page: 1 });
    }, 300);
  }
  function handleIsAvailableChange(value: string | null) {
    const resolved = value === 'true' ? true : value === 'false' ? false : undefined;
    onChange({ ...paramsRef.current, is_available: resolved, page: 1 });
  }
  function handleClear() { onChange({ page: 1 }); }

  const activeCount = [
    !!params.search, params.is_available !== undefined,
  ].filter(Boolean).length;

  const isAvailableValue =
    params.is_available === true ? 'true' : params.is_available === false ? 'false' : 'all';

  const searchInput = (cls: string) => (
    <Input
      placeholder="Buscar por licencia o teléfono…"
      value={searchValue}
      onChange={(e) => handleSearchChange(e.target.value)}
      className={cls}
    />
  );
  const availabilitySelect = (cls: string) => (
    <Select value={isAvailableValue} onValueChange={handleIsAvailableChange}>
      <SelectTrigger className={cls}><SelectValue placeholder="Todos" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        <SelectItem value="true">Disponible</SelectItem>
        <SelectItem value="false">No disponible</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex flex-wrap gap-2 items-center">
        {searchInput('w-64')}
        {availabilitySelect('w-40')}
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
                {availabilitySelect('w-full')}
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
