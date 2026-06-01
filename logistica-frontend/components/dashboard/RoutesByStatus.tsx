'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MOCK_FLEET_AREA } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, AXIS_TICK, GRID_STROKE, CHART_COLORS } from '@/lib/chartTheme';

export function RoutesByStatus() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Rutas y flota</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Actividad mensual de la flota</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={MOCK_FLEET_AREA}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradActivas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CHART_COLORS.blue}   stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.blue}   stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradMant" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CHART_COLORS.amber}  stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.amber}  stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradInact" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CHART_COLORS.zinc}   stopOpacity={0.25} />
              <stop offset="95%" stopColor={CHART_COLORS.zinc}   stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="period" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={CHART_TOOLTIP}
            cursor={{ stroke: 'rgba(148,163,184,0.2)', strokeWidth: 1 }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '8px' }}
          />
          <Area
            type="monotone"
            dataKey="activas"
            name="Activas"
            stroke={CHART_COLORS.blue}
            strokeWidth={2}
            fill="url(#gradActivas)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="mantenimiento"
            name="Mantenimiento"
            stroke={CHART_COLORS.amber}
            strokeWidth={2}
            fill="url(#gradMant)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="inactivas"
            name="Inactivas"
            stroke={CHART_COLORS.zinc}
            strokeWidth={2}
            fill="url(#gradInact)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
