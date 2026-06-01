'use client';

import { useState } from 'react';
import { BarList } from '@tremor/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useDriversBulk } from '@/hooks/useDashboard';
import { computeLicenseExpiry } from '@/lib/dashboardUtils';

export function LicenseExpiryAlerts() {
  const [daysAhead, setDaysAhead] = useState<30 | 60 | 90>(30);
  const { data, isLoading, isError } = useDriversBulk();

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No se pudo cargar datos de conductores</AlertDescription>
      </Alert>
    );
  }

  const expiryItems = computeLicenseExpiry(data?.results ?? [], daysAhead);

  const barListData = expiryItems.map((item) => ({
    name: `${item.name} (${item.value < 0 ? 'Expirada' : item.value + 'd'})`,
    value: Math.abs(item.value),
    isExpired: item.value < 0,
  }));

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-semibold">Alertas de licencias</h3>
        <div className="flex gap-1.5 shrink-0">
          {([30, 60, 90] as const).map((days) => (
            <Button
              key={days}
              size="sm"
              variant={daysAhead === days ? 'default' : 'outline'}
              onClick={() => setDaysAhead(days)}
              className="h-7 px-2.5 text-xs"
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>
      {expiryItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay conductores con licencia próxima a vencer
        </p>
      ) : (
        <div className="space-y-1">
          {barListData.map((item) => (
            <div
              key={item.name}
              className={item.isExpired ? 'text-destructive' : undefined}
            >
              <BarList
                data={[{ name: item.name, value: item.value }]}
                valueFormatter={(v: number) => `${v}d`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
