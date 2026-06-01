'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_CUSTOMER_TYPE } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, CHART_COLORS } from '@/lib/chartTheme';

const COLORS = [CHART_COLORS.blue, CHART_COLORS.cyan];

export function CustomerTypeChart() {
  const total = MOCK_CUSTOMER_TYPE.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Tipo de clientes</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{total} clientes activos</p>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={MOCK_CUSTOMER_TYPE}
              cx="50%"
              cy="50%"
              innerRadius={34}
              outerRadius={52}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {MOCK_CUSTOMER_TYPE.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={CHART_TOOLTIP}
              formatter={(v: number) => [v, 'Clientes']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {MOCK_CUSTOMER_TYPE.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tabular-nums">{item.value}</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round((item.value / total) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
