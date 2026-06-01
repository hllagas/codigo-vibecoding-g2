'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MOCK_DELIVERY_PERFORMANCE } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, AXIS_TICK, GRID_STROKE, CHART_COLORS } from '@/lib/chartTheme';
import type { DashboardFiltersState } from '@/types/dashboard';

interface DeliveryPerformanceProps {
  filters: DashboardFiltersState;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DeliveryPerformance({ filters }: DeliveryPerformanceProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Rendimiento de entregas</h3>
        <p className="text-xs text-muted-foreground mt-0.5">A tiempo vs atrasado por mes</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={MOCK_DELIVERY_PERFORMANCE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="period" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={CHART_TOOLTIP}
            cursor={{ fill: 'rgba(148,163,184,0.06)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '8px' }}
          />
          <Bar
            dataKey="onTime"
            name="A tiempo"
            stackId="a"
            fill={CHART_COLORS.emerald}
            maxBarSize={48}
          />
          <Bar
            dataKey="delayed"
            name="Atrasado"
            stackId="a"
            fill={CHART_COLORS.red}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
