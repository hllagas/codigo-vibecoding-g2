'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_DRIVER_AVAILABILITY } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, CHART_TOOLTIP_ITEM, CHART_TOOLTIP_LABEL, CHART_COLORS } from '@/lib/chartTheme';

const COLORS = [CHART_COLORS.emerald, CHART_COLORS.zinc];

export function DriverAvailability() {
  const total = MOCK_DRIVER_AVAILABILITY.reduce((s, d) => s + d.value, 0);
  const available = MOCK_DRIVER_AVAILABILITY[0]?.value ?? 0;
  const availablePct = Math.round((available / total) * 100);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Disponibilidad de conductores</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{total} conductores en total</p>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={MOCK_DRIVER_AVAILABILITY}
              cx="50%"
              cy="50%"
              innerRadius={34}
              outerRadius={52}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {MOCK_DRIVER_AVAILABILITY.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            {/* Center: available % */}
            <text
              x="50%"
              y="44%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fill: CHART_COLORS.emerald, fontSize: 16, fontWeight: 700 }}
            >
              {availablePct}%
            </text>
            <text
              x="50%"
              y="62%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fill: '#64748b', fontSize: 9 }}
            >
              disp.
            </text>
            <Tooltip
              contentStyle={CHART_TOOLTIP}
              itemStyle={CHART_TOOLTIP_ITEM}
              labelStyle={CHART_TOOLTIP_LABEL}
              formatter={(v: number) => [v, 'Conductores']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {MOCK_DRIVER_AVAILABILITY.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: COLORS[i] }}
                >
                  {item.value}
                </span>
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
