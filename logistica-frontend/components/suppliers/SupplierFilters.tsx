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
import type { SupplierListParams } from '@/types/supplier';

interface SupplierFiltersProps {
  params: SupplierListParams;
  onChange: (params: SupplierListParams) => void;
}

export function SupplierFilters({ params, onChange }: SupplierFiltersProps) {
  const [searchValue, setSearchValue] = useState(params.search ?? '');
  const [cityValue, setCityValue] = useState(params.city ?? '');
  const [countryValue, setCountryValue] = useState(params.country ?? '');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always-current params ref — fixes stale closure in timer callbacks
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => { setSearchValue(params.search ?? ''); }, [params.search]);
  useEffect(() => { setCityValue(params.city ?? ''); }, [params.city]);
  useEffect(() => { setCountryValue(params.country ?? ''); }, [params.country]);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onChange({ ...paramsRef.current, search: value.trim() || undefined, page: 1 });
    }, 300);
  }
  function handleCityChange(value: string) {
    setCityValue(value);
    if (cityTimerRef.current) clearTimeout(cityTimerRef.current);
    cityTimerRef.current = setTimeout(() => {
      onChange({ ...paramsRef.current, city: value.trim() || undefined, page: 1 });
    }, 300);
  }
  function handleCountryChange(value: string) {
    setCountryValue(value);
    if (countryTimerRef.current) clearTimeout(countryTimerRef.current);
    countryTimerRef.current = setTimeout(() => {
      onChange({ ...paramsRef.current, country: value.trim() || undefined, page: 1 });
    }, 300);
  }
  function handleIsActiveChange(value: string | null) {
    const isActive = value === 'true' ? true : value === 'false' ? false : undefined;
    onChange({ ...paramsRef.current, is_active: isActive, page: 1 });
  }
  function handleClear() { onChange({ page: 1 }); }

  const activeCount = [
    !!params.search, !!params.city, !!params.country, params.is_active !== undefined,
  ].filter(Boolean).length;

  const activeSelectValue =
    params.is_active === true ? 'true' : params.is_active === false ? 'false' : 'all';

  const searchInput = (cls: string) => (
    <Input placeholder="Buscar por nombre, email, RUC…" value={searchValue}
      onChange={(e) => handleSearchChange(e.target.value)} className={cls} />
  );
  const cityInput = (cls: string) => (
    <Input placeholder="Ciudad" value={cityValue}
      onChange={(e) => handleCityChange(e.target.value)} className={cls} />
  );
  const countryInput = (cls: string) => (
    <Input placeholder="País" value={countryValue}
      onChange={(e) => handleCountryChange(e.target.value)} className={cls} />
  );
  const statusSelect = (cls: string) => (
    <Select value={activeSelectValue} onValueChange={handleIsActiveChange}>
      <SelectTrigger className={cls}><SelectValue placeholder="Estado" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        <SelectItem value="true">Activo</SelectItem>
        <SelectItem value="false">Inactivo</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex flex-wrap gap-2 items-center">
        {searchInput('w-64')}
        {cityInput('w-36')}
        {countryInput('w-36')}
        {statusSelect('w-36')}
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
                {cityInput('w-full')}
                {countryInput('w-full')}
                {statusSelect('w-full')}
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
