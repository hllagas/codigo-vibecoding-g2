'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KpiData } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Accent = 'blue' | 'green' | 'red' | 'amber';

interface KpiCardProps {
  data?: KpiData;
  isLoading?: boolean;
  isError?: boolean;
  icon?: LucideIcon;
  accent?: Accent;
  progress?: number;
}

const accentMap: Record<Accent, {
  iconBg: string;
  iconColor: string;
  border: string;
  progressBar: string;
}> = {
  blue: {
    iconBg:      'bg-blue-500/15',
    iconColor:   'text-blue-400',
    border:      'hover:border-blue-500/40',
    progressBar: 'bg-blue-500',
  },
  green: {
    iconBg:      'bg-emerald-500/15',
    iconColor:   'text-emerald-400',
    border:      'hover:border-emerald-500/40',
    progressBar: 'bg-emerald-500',
  },
  red: {
    iconBg:      'bg-red-400/15',
    iconColor:   'text-red-400',
    border:      'hover:border-red-400/40',
    progressBar: 'bg-red-400',
  },
  amber: {
    iconBg:      'bg-amber-500/15',
    iconColor:   'text-amber-400',
    border:      'hover:border-amber-500/40',
    progressBar: 'bg-amber-500',
  },
};

const trendConfig = {
  up:      { icon: TrendingUp,   color: 'text-emerald-400' },
  down:    { icon: TrendingDown, color: 'text-red-400'     },
  neutral: { icon: Minus,        color: 'text-muted-foreground' },
};

export function KpiCard({
  data,
  isLoading,
  isError,
  icon: Icon,
  accent = 'blue',
  progress,
}: KpiCardProps) {
  const colors = accentMap[accent];

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 mt-1" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">{data?.label ?? 'Error'}</span>
        <span className="text-2xl font-bold tabular-nums text-muted-foreground">—</span>
        <span className="text-xs text-destructive">No se pudo cargar</span>
      </div>
    );
  }

  const trend = data.trend;
  const TrendIcon = trend ? trendConfig[trend].icon : null;
  const trendColor = trend ? trendConfig[trend].color : '';
  const pct = progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

  return (
    <div
      className={cn(
        'group rounded-xl border bg-card p-5',
        'shadow-sm hover:shadow-lg transition-all duration-200 cursor-default',
        'flex flex-col gap-3',
        colors.border,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground leading-tight">
          {data.label}
        </span>
        {Icon && (
          <div className={cn('rounded-lg p-2 shrink-0', colors.iconBg)}>
            <Icon className={cn('size-4', colors.iconColor)} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold tabular-nums leading-none">{data.value}</span>
        {TrendIcon && (
          <TrendIcon className={cn('size-4 mb-0.5 shrink-0', trendColor)} aria-hidden="true" />
        )}
      </div>

      {pct !== undefined && (
        <div className="w-full bg-muted/40 rounded-full h-1 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', colors.progressBar)}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      {data.subLabel && (
        <span className="text-xs text-muted-foreground leading-snug">{data.subLabel}</span>
      )}
    </div>
  );
}
