'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_FLEET_BY_TYPE } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, CHART_TOOLTIP_ITEM, CHART_TOOLTIP_LABEL, CHART_COLORS } from '@/lib/chartTheme';

const COLORS = [CHART_COLORS.sky, CHART_COLORS.emerald, CHART_COLORS.amber, CHART_COLORS.red];

export function FleetByType() {
  const total = MOCK_FLEET_BY_TYPE.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Flota por tipo</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Distribución de vehículos</p>
      </div>

      <div className="flex items-center gap-4">
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie
              data={MOCK_FLEET_BY_TYPE}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={60}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {MOCK_FLEET_BY_TYPE.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
              formatter={(v: number) => [v, 'Vehículos']}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Custom side legend with counts (replaces Recharts built-in Legend) */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {MOCK_FLEET_BY_TYPE.map((item, i) => {
            const pct = Math.round((item.value / total) * 100);
            return (
              <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                  {item.name}
                </span>
                <span
                  className="text-xs tabular-nums font-semibold shrink-0"
                  style={{ color: COLORS[i % COLORS.length] }}
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
