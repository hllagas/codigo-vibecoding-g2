'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MOCK_FLEET_BY_TYPE } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, CHART_COLORS } from '@/lib/chartTheme';

const COLORS = [CHART_COLORS.sky, CHART_COLORS.emerald, CHART_COLORS.amber, CHART_COLORS.red];

export function FleetByType() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Flota por tipo</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Distribución de vehículos</p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={MOCK_FLEET_BY_TYPE}
            cx="50%"
            cy="50%"
            innerRadius={44}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {MOCK_FLEET_BY_TYPE.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP}
            formatter={(v: number) => [v, 'Vehículos']}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
