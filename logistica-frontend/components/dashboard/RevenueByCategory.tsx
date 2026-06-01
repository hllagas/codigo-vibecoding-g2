'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { MOCK_REVENUE_BY_CATEGORY } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, AXIS_TICK, GRID_STROKE, CHART_COLORS } from '@/lib/chartTheme';
import type { DashboardFiltersState } from '@/types/dashboard';

interface RevenueByCategoryProps {
  filters: DashboardFiltersState;
}

const usd = (v: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RevenueByCategory({ filters }: RevenueByCategoryProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Ingresos por categoría</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Valor total de envíos</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={MOCK_REVENUE_BY_CATEGORY}
          margin={{ top: 4, right: 4, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP}
            cursor={{ fill: 'rgba(148,163,184,0.06)' }}
            formatter={(v: number) => [usd(v), 'Ingresos']}
          />
          <Bar
            dataKey="value"
            fill={CHART_COLORS.violet}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
