'use client';

import { useShipmentsBulk } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DashboardFiltersState } from '@/types/dashboard';

// Predefined city grid positions [left%, top%] on a simplified world map canvas
const CITY_NODES: { city: string; country: string; x: number; y: number; region: string }[] = [
  { city: 'Nueva York', country: 'US', x: 22, y: 32, region: 'NA' },
  { city: 'Miami', country: 'US', x: 23, y: 40, region: 'NA' },
  { city: 'Ciudad de México', country: 'MX', x: 18, y: 42, region: 'NA' },
  { city: 'São Paulo', country: 'BR', x: 32, y: 65, region: 'SA' },
  { city: 'Buenos Aires', country: 'AR', x: 30, y: 75, region: 'SA' },
  { city: 'Bogotá', country: 'CO', x: 26, y: 52, region: 'SA' },
  { city: 'Madrid', country: 'ES', x: 46, y: 28, region: 'EU' },
  { city: 'París', country: 'FR', x: 48, y: 24, region: 'EU' },
  { city: 'Ámsterdam', country: 'NL', x: 49, y: 20, region: 'EU' },
  { city: 'Berlín', country: 'DE', x: 51, y: 21, region: 'EU' },
  { city: 'Milán', country: 'IT', x: 51, y: 27, region: 'EU' },
  { city: 'Estambul', country: 'TR', x: 57, y: 28, region: 'ME' },
  { city: 'Dubái', country: 'AE', x: 62, y: 38, region: 'ME' },
  { city: 'Mumbai', country: 'IN', x: 67, y: 42, region: 'AS' },
  { city: 'Singapur', country: 'SG', x: 78, y: 52, region: 'AS' },
  { city: 'Hong Kong', country: 'HK', x: 80, y: 38, region: 'AS' },
  { city: 'Shanghái', country: 'CN', x: 81, y: 33, region: 'AS' },
  { city: 'Tokio', country: 'JP', x: 86, y: 30, region: 'AS' },
  { city: 'Sídney', country: 'AU', x: 85, y: 72, region: 'OC' },
  { city: 'Lagos', country: 'NG', x: 50, y: 50, region: 'AF' },
  { city: 'Nairobi', country: 'KE', x: 58, y: 53, region: 'AF' },
  { city: 'Johannesburgo', country: 'ZA', x: 56, y: 68, region: 'AF' },
];

const REGION_LINE_PAIRS = [
  [0, 6], [1, 7], [2, 5], [5, 11], [11, 12], [12, 13],
  [13, 14], [14, 16], [16, 17], [15, 17], [6, 7], [7, 8],
];

interface ActivityHeatMapProps {
  filters: DashboardFiltersState;
}

export function ActivityHeatMap({ filters }: ActivityHeatMapProps) {
  const { data, isLoading } = useShipmentsBulk(filters.dateFrom, filters.dateTo);

  // Count shipments per destination country to determine pin activity
  const countryActivity = (data?.results ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.destination_country] = (acc[s.destination_country] ?? 0) + 1;
    return acc;
  }, {});

  const maxActivity = Math.max(1, ...Object.values(countryActivity));

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  return (
    <div className="rounded-xl border bg-card/80 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold">Actividad global</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nodos activos de envío por región
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-green-400 dark:bg-green-400" />
            Alta actividad
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-blue-400" />
            Activo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-zinc-500" />
            Sin datos
          </span>
        </div>
      </div>

      {/* Map canvas */}
      <div className="relative w-full bg-zinc-950/30 dark:bg-zinc-950/60" style={{ paddingBottom: '42%' }}>
        {/* Grid lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          viewBox="0 0 100 42"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Latitude lines */}
          {[10, 20, 30, 40].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeWidth="0.3" />
          ))}
          {/* Longitude lines */}
          {[20, 40, 60, 80].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="42" stroke="currentColor" strokeWidth="0.3" />
          ))}
          {/* Connection lines between city pairs */}
          {REGION_LINE_PAIRS.map(([a, b], i) => {
            const from = CITY_NODES[a];
            const to = CITY_NODES[b];
            const hasActivity =
              (countryActivity[from.country] ?? 0) > 0 || (countryActivity[to.country] ?? 0) > 0;
            return (
              <line
                key={i}
                x1={from.x}
                y1={(from.y / 100) * 42}
                x2={to.x}
                y2={(to.y / 100) * 42}
                stroke={hasActivity ? '#3B82F6' : '#6B7280'}
                strokeWidth="0.25"
                strokeDasharray="1 1"
                opacity={hasActivity ? 0.6 : 0.25}
              />
            );
          })}
        </svg>

        {/* City pins */}
        {CITY_NODES.map((node) => {
          const activity = countryActivity[node.country] ?? 0;
          const intensity = activity / maxActivity;
          const isHot = intensity > 0.5;
          const isActive = activity > 0;

          return (
            <div
              key={node.city}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${node.x}%`, top: `${(node.y / 100) * 100}%` }}
            >
              {/* Pulse ring for active nodes */}
              {isActive && (
                <span
                  className={cn(
                    'absolute inset-0 rounded-full animate-ping opacity-50',
                    isHot ? 'bg-green-400' : 'bg-blue-400',
                  )}
                  style={{ animationDuration: isHot ? '1.5s' : '2.5s' }}
                  aria-hidden="true"
                />
              )}
              {/* Pin dot */}
              <span
                className={cn(
                  'relative block rounded-full transition-transform duration-200 group-hover:scale-150',
                  isHot
                    ? 'size-3 bg-green-400 dark:bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.5)]'
                    : isActive
                      ? 'size-2.5 bg-blue-400 shadow-[0_0_6px_1px_rgba(96,165,250,0.4)]'
                      : 'size-1.5 bg-zinc-600',
                )}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-zinc-900 dark:bg-zinc-800 border border-white/10 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10 shadow-lg">
                <span className="font-medium">{node.city}</span>
                {activity > 0 && (
                  <span className="ml-1 text-blue-300">· {activity} envíos</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-6 px-5 py-3 border-t border-border/40 bg-muted/10">
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{Object.keys(countryActivity).length}</span>
          {' '}países con actividad
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{data?.results.length ?? 0}</span>
          {' '}envíos totales en período
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{CITY_NODES.length}</span>
          {' '}nodos monitoreados
        </div>
      </div>
    </div>
  );
}
