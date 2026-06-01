'use client';

import { useQuery } from '@tanstack/react-query';
import { listShipments } from '@/services/shipmentService';
import { listDrivers } from '@/services/driverService';
import { listRoutes } from '@/services/routeService';
import { listWarehouses, getWarehouseStock } from '@/services/warehouseService';
import { listProducts } from '@/services/productService';
import { listCustomers } from '@/services/customerService';
import { listTransports } from '@/services/transportService';
import type { ShipmentStatus } from '@/types/shipment';
import type { WarehouseStock } from '@/types/warehouse';

// KPI hooks

export function useShipmentCountByStatus(
  status: ShipmentStatus,
  dateFrom?: string,
  dateTo?: string,
) {
  return useQuery({
    queryKey: ['dashboard', 'shipment-count', status, dateFrom, dateTo],
    queryFn: () =>
      listShipments({
        status,
        page_size: 1,
        ...(dateFrom && { created_at__gte: dateFrom }),
        ...(dateTo && { created_at__lte: dateTo }),
      }),
    select: (data) => data.count,
  });
}

export function useDriverAvailabilityCounts() {
  const available = useQuery({
    queryKey: ['dashboard', 'drivers-available'],
    queryFn: () => listDrivers({ is_available: true, page_size: 1 }),
    select: (data) => data.count,
  });
  const total = useQuery({
    queryKey: ['dashboard', 'drivers-total'],
    queryFn: () => listDrivers({ page_size: 1 }),
    select: (data) => data.count,
  });
  return { available, total };
}

export function useRoutesInProgressCount() {
  return useQuery({
    queryKey: ['dashboard', 'routes-in-progress'],
    queryFn: () => listRoutes({ status: 'in_progress', page_size: 1 }),
    select: (data) => data.count,
  });
}

// Chart data hooks (bulk fetch for client-side grouping)

export function useShipmentsBulk(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['dashboard', 'shipments-bulk', dateFrom, dateTo],
    queryFn: () =>
      listShipments({
        page_size: 1000,
        ...(dateFrom && { created_at__gte: dateFrom }),
        ...(dateTo && { created_at__lte: dateTo }),
      }),
  });
}

export function useRoutesBulk() {
  return useQuery({
    queryKey: ['dashboard', 'routes-bulk'],
    queryFn: () => listRoutes({ page_size: 1000 }),
  });
}

export function useDriversBulk() {
  return useQuery({
    queryKey: ['dashboard', 'drivers-bulk'],
    queryFn: () => listDrivers({ page_size: 1000 }),
  });
}

export function useTransportsBulk(isActive?: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'transports-bulk', isActive],
    queryFn: () =>
      listTransports({
        page_size: 1000,
        ...(isActive !== undefined && { is_active: isActive }),
      }),
  });
}

export function useProductsBulk() {
  return useQuery({
    queryKey: ['dashboard', 'products-bulk'],
    queryFn: () => listProducts({ page_size: 1000, is_active: true }),
  });
}

export function useCustomersBulk(customerType?: string) {
  return useQuery({
    queryKey: ['dashboard', 'customers-bulk', customerType],
    queryFn: () =>
      listCustomers({
        page_size: 1000,
        ...(customerType && { customer_type: customerType as 'company' | 'individual' }),
      }),
  });
}

export function useWarehousesBulk() {
  return useQuery({
    queryKey: ['dashboard', 'warehouses-bulk'],
    queryFn: () => listWarehouses({ page_size: 1000, is_active: true }),
  });
}

export function useAllWarehouseStock(warehouseIds: number[]) {
  return useQuery({
    queryKey: ['dashboard', 'all-warehouse-stock', warehouseIds],
    queryFn: async (): Promise<WarehouseStock[]> => {
      const responses = await Promise.all(warehouseIds.map((id) => getWarehouseStock(id)));
      return responses.flatMap((r) => r?.results ?? []);
    },
    enabled: warehouseIds.length > 0,
  });
}
