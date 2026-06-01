'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { MOCK_TOP_CITIES } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, AXIS_TICK, GRID_STROKE, CHART_COLORS } from '@/lib/chartTheme';
import type { DashboardFiltersState } from '@/types/dashboard';

interface TopDestinationCitiesProps {
  filters: DashboardFiltersState;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TopDestinationCities({ filters }: TopDestinationCitiesProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Top 10 ciudades destino</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Por número de envíos</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={MOCK_TOP_CITIES}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
          <XAxis
            type="number"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ ...AXIS_TICK, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={96}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP}
            cursor={{ fill: 'rgba(148,163,184,0.06)' }}
            formatter={(v: number) => [v, 'Envíos']}
          />
          <Bar
            dataKey="value"
            fill={CHART_COLORS.indigo}
            radius={[0, 4, 4, 0]}
            maxBarSize={16}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
