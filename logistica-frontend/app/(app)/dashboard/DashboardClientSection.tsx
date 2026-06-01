'use client';

import { useState } from 'react';
import { Truck, CheckCircle2, AlertTriangle, Route } from 'lucide-react';
import type { DashboardFiltersState } from '@/types/dashboard';
import { getDateRange } from '@/lib/dashboardUtils';
import { MOCK_KPI } from '@/lib/mockDashboard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ShipmentsByStatus } from '@/components/dashboard/ShipmentsByStatus';
import { ShipmentVolumeChart } from '@/components/dashboard/ShipmentVolumeChart';
import { DeliveryPerformance } from '@/components/dashboard/DeliveryPerformance';
import { TopDestinationCities } from '@/components/dashboard/TopDestinationCities';
import { RoutesByStatus } from '@/components/dashboard/RoutesByStatus';
import { DriverAvailability } from '@/components/dashboard/DriverAvailability';
import { TripsPerTransport } from '@/components/dashboard/TripsPerTransport';
import { TopCustomers } from '@/components/dashboard/TopCustomers';
import { RevenueByCategory } from '@/components/dashboard/RevenueByCategory';
import { TopShippedProducts } from '@/components/dashboard/TopShippedProducts';
import { WarehouseUtilization } from '@/components/dashboard/WarehouseUtilization';
import { FleetByType } from '@/components/dashboard/FleetByType';
import { CustomerTypeChart } from '@/components/dashboard/CustomerTypeChart';
import { CustomerGrowth } from '@/components/dashboard/CustomerGrowth';
import { RecentShipmentsTable } from '@/components/dashboard/RecentShipmentsTable';
import { ChartErrorBoundary } from '@/components/ui/ChartErrorBoundary';

const SECTION_HEADER =
  'text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.12em] mb-4 border-b border-border/30 pb-2';

export function DashboardClientSection() {
  const [filters, setFilters] = useState<DashboardFiltersState>(() => {
    const range = getDateRange('30d');
    return { preset: '30d', ...range };
  });

  const { activeShipments, deliveryRate, delayedCount, routesInProgress,
    availableDrivers, totalDrivers, deliveredCount, totalFinished,
    cancelledCount, returnedCount } = MOCK_KPI;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Centro de control logístico — datos en tiempo real
          </p>
        </div>
        <DashboardFilters filters={filters} onChange={setFilters} />
      </div>

      {/* KPIs */}
      <section aria-label="Indicadores clave">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            icon={Truck}
            accent="blue"
            progress={Math.round((activeShipments / 80) * 100)}
            data={{
              label: 'Envíos en tránsito',
              value: activeShipments,
              subLabel: 'Envíos activos en ruta',
              trend: activeShipments > 10 ? 'up' : 'neutral',
            }}
          />
          <KpiCard
            icon={CheckCircle2}
            accent="green"
            progress={deliveryRate}
            data={{
              label: 'Tasa de entrega a tiempo',
              value: deliveryRate + '%',
              subLabel: `${deliveredCount} de ${totalFinished} finalizados`,
              trend: deliveryRate >= 80 ? 'up' : deliveryRate >= 60 ? 'neutral' : 'down',
            }}
          />
          <KpiCard
            icon={AlertTriangle}
            accent="red"
            progress={Math.round((delayedCount / 20) * 100)}
            data={{
              label: 'Cancelados / Devueltos',
              value: delayedCount,
              subLabel: `${cancelledCount} cancelados · ${returnedCount} devueltos`,
              trend: delayedCount > 5 ? 'down' : 'neutral',
            }}
          />
          <KpiCard
            icon={Route}
            accent="amber"
            progress={Math.round((availableDrivers / totalDrivers) * 100)}
            data={{
              label: 'Rutas en progreso',
              value: routesInProgress,
              subLabel: `${availableDrivers} / ${totalDrivers} conductores disponibles`,
              trend: 'neutral',
            }}
          />
        </div>
      </section>

      {/* Shipment analysis */}
      <section aria-label="Análisis de envíos">
        <h2 className={SECTION_HEADER}>Análisis de envíos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ChartErrorBoundary>
              <ShipmentVolumeChart filters={filters} />
            </ChartErrorBoundary>
          </div>
          <ChartErrorBoundary>
            <ShipmentsByStatus filters={filters} />
          </ChartErrorBoundary>
        </div>
      </section>

      {/* Recent shipments */}
      <section aria-label="Envíos recientes">
        <ChartErrorBoundary>
          <RecentShipmentsTable filters={filters} />
        </ChartErrorBoundary>
      </section>

      {/* Delivery performance */}
      <section aria-label="Rendimiento de entregas">
        <h2 className={SECTION_HEADER}>Rendimiento de entregas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartErrorBoundary><DeliveryPerformance filters={filters} /></ChartErrorBoundary>
          <ChartErrorBoundary><TopDestinationCities filters={filters} /></ChartErrorBoundary>
        </div>
      </section>

      {/* Routes & fleet */}
      <section aria-label="Rutas y flota">
        <h2 className={SECTION_HEADER}>Rutas y flota</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="lg:col-span-2 xl:col-span-1">
            <ChartErrorBoundary><RoutesByStatus /></ChartErrorBoundary>
          </div>
          <ChartErrorBoundary><DriverAvailability /></ChartErrorBoundary>
          <ChartErrorBoundary><TripsPerTransport /></ChartErrorBoundary>
        </div>
      </section>

      {/* Customers & products */}
      <section aria-label="Clientes y productos">
        <h2 className={SECTION_HEADER}>Clientes y productos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartErrorBoundary><TopCustomers filters={filters} /></ChartErrorBoundary>
          <ChartErrorBoundary><RevenueByCategory filters={filters} /></ChartErrorBoundary>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <ChartErrorBoundary><TopShippedProducts filters={filters} /></ChartErrorBoundary>
          <ChartErrorBoundary><CustomerGrowth /></ChartErrorBoundary>
        </div>
      </section>

      {/* Infrastructure */}
      <section aria-label="Infraestructura">
        <h2 className={SECTION_HEADER}>Infraestructura</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <ChartErrorBoundary><WarehouseUtilization /></ChartErrorBoundary>
          <ChartErrorBoundary><FleetByType /></ChartErrorBoundary>
          <ChartErrorBoundary><CustomerTypeChart /></ChartErrorBoundary>
        </div>
      </section>
    </div>
  );
}
