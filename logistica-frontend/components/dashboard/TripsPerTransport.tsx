'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MOCK_TRIPS_PER_TRANSPORT } from '@/lib/mockDashboard';
import { CHART_TOOLTIP, AXIS_TICK, GRID_STROKE } from '@/lib/chartTheme';

const COLORS = {
  completadas:  '#10b981',
  en_progreso:  '#f59e0b',
  planificadas: '#3b82f6',
};

const LABELS = {
  completadas:  'Completadas',
  en_progreso:  'En progreso',
  planificadas: 'Planificadas',
};

export function TripsPerTransport() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Viajes por transporte</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Rutas completadas, en progreso y planificadas</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={MOCK_TRIPS_PER_TRANSPORT}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          barCategoryGap="25%"
          barGap={2}
        >
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis
            dataKey="transport"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP}
            cursor={{ fill: 'rgba(148,163,184,0.06)' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '10px' }}
            formatter={(value: string) => LABELS[value as keyof typeof LABELS] ?? value}
          />
          <Bar dataKey="completadas"  stackId="a" fill={COLORS.completadas}  radius={[0, 0, 0, 0]} />
          <Bar dataKey="en_progreso"  stackId="a" fill={COLORS.en_progreso}  radius={[0, 0, 0, 0]} />
          <Bar dataKey="planificadas" stackId="a" fill={COLORS.planificadas} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
