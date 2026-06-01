'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { MOCK_CUSTOMER_GROWTH } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, AXIS_TICK, GRID_STROKE, CHART_COLORS } from '@/lib/chartTheme';

export function CustomerGrowth() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Crecimiento de clientes</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Total acumulado por mes</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={MOCK_CUSTOMER_GROWTH}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradCustomers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CHART_COLORS.cyan} stopOpacity={0.35} />
              <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="period" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={CHART_TOOLTIP}
            cursor={{ stroke: 'rgba(148,163,184,0.2)', strokeWidth: 1 }}
            formatter={(v: number) => [v, 'Clientes']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={CHART_COLORS.cyan}
            strokeWidth={2}
            fill="url(#gradCustomers)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
