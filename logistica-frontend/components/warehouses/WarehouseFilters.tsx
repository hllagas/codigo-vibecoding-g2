'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WarehouseListParams } from '@/types/warehouse';

interface WarehouseFiltersProps {
  params: WarehouseListParams;
  onChange: (params: WarehouseListParams) => void;
}

export function WarehouseFilters({ params, onChange }: WarehouseFiltersProps) {
  const [cityValue, setCityValue] = useState(params.city ?? '');
  const [countryValue, setCountryValue] = useState(params.country ?? '');

  // Sync local state when params reset externally
  useEffect(() => {
    setCityValue(params.city ?? '');
    setCountryValue(params.country ?? '');
  }, [params.city, params.country]);

  function handleCityBlur() {
    const newCity = cityValue.trim() || undefined;
    if (newCity !== params.city) {
      onChange({ ...params, city: newCity, page: 1 });
    }
  }

  function handleCityKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleCityBlur();
  }

  function handleCountryBlur() {
    const newCountry = countryValue.trim() || undefined;
    if (newCountry !== params.country) {
      onChange({ ...params, country: newCountry, page: 1 });
    }
  }

  function handleCountryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleCountryBlur();
  }

  function handleIsActiveChange(value: string | null) {
    let isActive: boolean | undefined;
    if (value === 'true') isActive = true;
    else if (value === 'false') isActive = false;
    else isActive = undefined;
    onChange({ ...params, is_active: isActive, page: 1 });
  }

  function handleClearFilters() {
    onChange({ page: 1 });
  }

  const hasActiveFilters =
    !!params.city || !!params.country || params.is_active !== undefined;

  const activeSelectValue =
    params.is_active === true ? 'true' : params.is_active === false ? 'false' : 'all';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Input
        placeholder="Ciudad"
        value={cityValue}
        onChange={(e) => setCityValue(e.target.value)}
        onBlur={handleCityBlur}
        onKeyDown={handleCityKeyDown}
        className="w-full sm:w-36"
      />
      <Input
        placeholder="País"
        value={countryValue}
        onChange={(e) => setCountryValue(e.target.value)}
        onBlur={handleCountryBlur}
        onKeyDown={handleCountryKeyDown}
        className="w-full sm:w-36"
      />
      <Select value={activeSelectValue} onValueChange={handleIsActiveChange}>
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Activo</SelectItem>
          <SelectItem value="false">Inactivo</SelectItem>
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
