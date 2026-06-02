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
import { useSuppliers } from '@/hooks/useSuppliers';
import type { ProductListParams } from '@/types/product';

interface ProductFiltersProps {
  params: ProductListParams;
  onChange: (params: ProductListParams) => void;
}

export function ProductFilters({ params, onChange }: ProductFiltersProps) {
  const { data: suppliersData } = useSuppliers({ page: 1 });
  const suppliers = suppliersData?.results ?? [];

  const [searchValue, setSearchValue] = useState(params.search ?? '');
  const [categoryValue, setCategoryValue] = useState(params.category ?? '');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always-current params ref — fixes stale closure in timer callbacks
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => { setSearchValue(params.search ?? ''); }, [params.search]);
  useEffect(() => { setCategoryValue(params.category ?? ''); }, [params.category]);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onChange({ ...paramsRef.current, search: value.trim() || undefined, page: 1 });
    }, 300);
  }
  function handleCategoryChange(value: string) {
    setCategoryValue(value);
    if (categoryTimerRef.current) clearTimeout(categoryTimerRef.current);
    categoryTimerRef.current = setTimeout(() => {
      onChange({ ...paramsRef.current, category: value.trim() || undefined, page: 1 });
    }, 300);
  }
  function handleSupplierChange(value: string | null) {
    const resolved = value === 'all' || !value ? undefined : parseInt(value, 10);
    onChange({ ...paramsRef.current, supplier: resolved, page: 1 });
  }
  function handleIsActiveChange(value: string | null) {
    const resolved = value === 'true' ? true : value === 'false' ? false : undefined;
    onChange({ ...paramsRef.current, is_active: resolved, page: 1 });
  }
  function handleClear() { onChange({ page: 1 }); }

  const activeCount = [
    !!params.search, !!params.category, params.supplier !== undefined, params.is_active !== undefined,
  ].filter(Boolean).length;

  const supplierValue = params.supplier !== undefined ? String(params.supplier) : 'all';
  const isActiveValue = params.is_active === true ? 'true' : params.is_active === false ? 'false' : 'all';

  const searchInput = (cls: string) => (
    <Input placeholder="Buscar por nombre o SKU…" value={searchValue}
      onChange={(e) => handleSearchChange(e.target.value)} className={cls} />
  );
  const categoryInput = (cls: string) => (
    <Input placeholder="Categoría" value={categoryValue}
      onChange={(e) => handleCategoryChange(e.target.value)} className={cls} />
  );
  const supplierSelect = (cls: string) => (
    <Select value={supplierValue} onValueChange={handleSupplierChange}>
      <SelectTrigger className={cls}><SelectValue placeholder="Todos los proveedores" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los proveedores</SelectItem>
        {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
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

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex flex-wrap gap-2 items-center">
        {searchInput('w-64')}
        {categoryInput('w-40')}
        {supplierSelect('w-48')}
        {activeSelect('w-36')}
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
                {categoryInput('w-full')}
                {supplierSelect('w-full')}
                {activeSelect('w-full')}
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
