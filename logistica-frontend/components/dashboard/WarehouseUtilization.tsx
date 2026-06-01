'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MOCK_WAREHOUSE_UTILIZATION } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, AXIS_TICK, GRID_STROKE, CHART_COLORS } from '@/lib/chartTheme';

export function WarehouseUtilization() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Utilización de almacenes</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Stock actual vs capacidad</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={MOCK_WAREHOUSE_UTILIZATION}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={CHART_TOOLTIP}
            cursor={{ fill: 'rgba(148,163,184,0.06)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '8px' }}
          />
          <Bar
            dataKey="stock"
            name="Stock"
            stackId="a"
            fill={CHART_COLORS.sky}
            maxBarSize={40}
          />
          <Bar
            dataKey="capacity"
            name="Capacidad"
            stackId="a"
            fill={CHART_COLORS.slate}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
