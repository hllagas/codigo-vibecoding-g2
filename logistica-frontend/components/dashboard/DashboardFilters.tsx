'use client';

import type { DashboardFiltersState, DatePreset } from '@/types/dashboard';
import { getDateRange } from '@/lib/dashboardUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardFiltersProps {
  filters: DashboardFiltersState;
  onChange: (filters: DashboardFiltersState) => void;
}

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: '7d',   value: '7d'  },
  { label: '30d',  value: '30d' },
  { label: '90d',  value: '90d' },
  { label: 'Custom', value: 'custom' },
];

const MODULES = [
  { label: 'Todos los módulos', value: 'all'       },
  { label: 'Envíos',            value: 'shipments' },
  { label: 'Rutas',             value: 'routes'    },
  { label: 'Conductores',       value: 'drivers'   },
  { label: 'Almacenes',         value: 'warehouses'},
  { label: 'Clientes',          value: 'customers' },
];

export function DashboardFilters({ filters, onChange }: DashboardFiltersProps) {
  function handlePreset(preset: DatePreset) {
    if (preset === 'custom') {
      onChange({ ...filters, preset: 'custom' });
    } else {
      const range = getDateRange(preset);
      onChange({ preset, ...range });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Module dropdown */}
      <Select defaultValue="all">
        <SelectTrigger className="h-8 w-44 text-xs bg-card border-border/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MODULES.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date presets */}
      <div className="flex gap-1.5">
        {PRESETS.map(({ label, value }) => (
          <Button
            key={value}
            size="sm"
            variant={filters.preset === value ? 'default' : 'outline'}
            onClick={() => handlePreset(value)}
            className="h-8 px-3 text-xs"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Custom date range inputs */}
      {filters.preset === 'custom' && (
        <div className="flex gap-2">
          <Input
            type="date"
            className="h-8 w-auto text-xs bg-card"
            value={filters.dateFrom}
            onChange={(e) => onChange({ ...filters, preset: 'custom', dateFrom: e.target.value })}
          />
          <Input
            type="date"
            className="h-8 w-auto text-xs bg-card"
            value={filters.dateTo}
            onChange={(e) => onChange({ ...filters, preset: 'custom', dateTo: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
