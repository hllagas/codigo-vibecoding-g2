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

  useEffect(() => {
    setSearchValue(params.search ?? '');
  }, [params.search]);

  useEffect(() => {
    setCategoryValue(params.category ?? '');
  }, [params.category]);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onChange({ ...params, search: value.trim() || undefined, page: 1 });
    }, 300);
  }

  function commitCategory(value: string) {
    onChange({ ...params, category: value.trim() || undefined, page: 1 });
  }

  function handleCategoryBlur() {
    commitCategory(categoryValue);
  }

  function handleCategoryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitCategory(categoryValue);
  }

  function handleSupplierChange(value: string | null) {
    const resolved = value === 'all' || !value
      ? undefined
      : parseInt(value, 10);
    onChange({ ...params, supplier: resolved, page: 1 });
  }

  function handleIsActiveChange(value: string | null) {
    const resolved = value === 'true' ? true : value === 'false' ? false : undefined;
    onChange({ ...params, is_active: resolved, page: 1 });
  }

  const hasActiveFilters =
    params.search !== undefined ||
    params.category !== undefined ||
    params.supplier !== undefined ||
    params.is_active !== undefined;

  const supplierSelectValue =
    params.supplier !== undefined ? String(params.supplier) : 'all';

  const isActiveSelectValue =
    params.is_active === true ? 'true' : params.is_active === false ? 'false' : 'all';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Input
        placeholder="Buscar por nombre o SKU…"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full sm:w-64"
      />
      <Input
        placeholder="Categoría"
        value={categoryValue}
        onChange={(e) => setCategoryValue(e.target.value)}
        onBlur={handleCategoryBlur}
        onKeyDown={handleCategoryKeyDown}
        className="w-full sm:w-40"
      />
      <Select value={supplierSelectValue} onValueChange={handleSupplierChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Todos los proveedores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los proveedores</SelectItem>
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={isActiveSelectValue} onValueChange={handleIsActiveChange}>
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Activo</SelectItem>
          <SelectItem value="false">Inactivo</SelectItem>
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
