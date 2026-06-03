'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_SHIPMENTS_BY_STATUS } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, CHART_TOOLTIP_ITEM, CHART_TOOLTIP_LABEL } from '@/lib/chartTheme';
import { cn } from '@/lib/utils';
import type { DashboardFiltersState } from '@/types/dashboard';

interface ShipmentsByStatusProps {
  filters: DashboardFiltersState;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ShipmentsByStatus({ filters }: ShipmentsByStatusProps) {
  const data = MOCK_SHIPMENTS_BY_STATUS;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">Envíos por estado</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{total} envíos en total</p>
      </div>

      <div className="flex items-center gap-4 flex-1">
        {/* Recharts donut with center label */}
        <div className="shrink-0 relative">
          <ResponsiveContainer width={130} height={130}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <text
                x="50%"
                y="46%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fill: '#f1f5f9', fontSize: 18, fontWeight: 700 }}
              >
                {total}
              </text>
              <text
                x="50%"
                y="62%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fill: '#64748b', fontSize: 10 }}
              >
                total
              </text>
              <Tooltip
                contentStyle={CHART_TOOLTIP}
                itemStyle={CHART_TOOLTIP_ITEM}
                labelStyle={CHART_TOOLTIP_LABEL}
                formatter={(v: number, name: string) => [v, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {data.map((item, i) => {
            const pct = Math.round((item.value / total) * 100);
            return (
              <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                  {item.name}
                </span>
                <span
                  className={cn(
                    'text-xs tabular-nums font-semibold shrink-0',
                    i === 0 ? 'text-emerald-400' : 'text-foreground',
                  )}
                  style={i > 0 ? { color: item.color } : undefined}
                >
                  {item.value}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground w-7 text-right shrink-0">
                  {pct}%
                </span>
              </div>
            );
          })}
          <div className="pt-1.5 border-t border-border/40 flex justify-between">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-xs font-bold tabular-nums">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
