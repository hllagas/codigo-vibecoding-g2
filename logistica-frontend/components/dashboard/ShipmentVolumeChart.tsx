'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { MOCK_SHIPMENT_VOLUME_WEEKLY, MOCK_SHIPMENT_VOLUME_MONTHLY } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, AXIS_TICK, GRID_STROKE, CHART_COLORS } from '@/lib/chartTheme';
import type { DashboardFiltersState } from '@/types/dashboard';

interface ShipmentVolumeChartProps {
  filters: DashboardFiltersState;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ShipmentVolumeChart({ filters }: ShipmentVolumeChartProps) {
  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('weekly');
  const chartData =
    granularity === 'weekly' ? MOCK_SHIPMENT_VOLUME_WEEKLY : MOCK_SHIPMENT_VOLUME_MONTHLY;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold">Volumen de envíos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Envíos creados por período</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button
            size="sm"
            variant={granularity === 'weekly' ? 'default' : 'outline'}
            onClick={() => setGranularity('weekly')}
            className="h-7 px-2.5 text-xs"
          >
            Semanal
          </Button>
          <Button
            size="sm"
            variant={granularity === 'monthly' ? 'default' : 'outline'}
            onClick={() => setGranularity('monthly')}
            className="h-7 px-2.5 text-xs"
          >
            Mensual
          </Button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="period" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={CHART_TOOLTIP}
            cursor={{ fill: 'rgba(148,163,184,0.06)' }}
            formatter={(v: number) => [v, 'Envíos']}
          />
          <Bar
            dataKey="count"
            fill={CHART_COLORS.blue}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
