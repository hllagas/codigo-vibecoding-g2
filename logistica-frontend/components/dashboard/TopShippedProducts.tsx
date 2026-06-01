'use client';

import { MOCK_TOP_PRODUCTS } from '@/lib/mockDashboard';
import { CHART_COLORS } from '@/lib/chartTheme';
import type { DashboardFiltersState } from '@/types/dashboard';

interface TopShippedProductsProps {
  filters: DashboardFiltersState;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TopShippedProducts({ filters }: TopShippedProductsProps) {
  const max = Math.max(...MOCK_TOP_PRODUCTS.map((d) => d.value));

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Top 10 productos enviados</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Por unidades despachadas</p>
      </div>
      <div className="space-y-2.5">
        {MOCK_TOP_PRODUCTS.map((item, i) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-4 shrink-0 tabular-nums">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium truncate">{item.name}</span>
                <span className="text-xs tabular-nums font-semibold ml-2 shrink-0">{item.value}</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / max) * 100}%`,
                    backgroundColor: CHART_COLORS.violet,
                    opacity: 0.7 + (item.value / max) * 0.3,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
