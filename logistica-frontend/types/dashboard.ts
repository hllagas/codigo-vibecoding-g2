export interface DateRange {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
}

export type DatePreset = '7d' | '30d' | '90d' | 'custom';

export interface DashboardFiltersState {
  preset: DatePreset;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
}

export interface KpiData {
  label: string;
  value: string | number;
  subLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface TimeSeriesPoint {
  period: string; // e.g. "2025-W01" or "2025-01"
  count: number;
}

export interface DeliveryPerformancePoint {
  period: string; // "YYYY-MM"
  onTime: number;
  delayed: number;
}

export interface WarehouseUtilizationPoint {
  name: string;     // warehouse name
  stock: number;    // total units in stock
  capacity: number; // warehouse capacity
}

export interface LicenseExpiryItem {
  name: string;  // driver full name
  value: number; // days until expiry (negative if expired)
  href?: string; // optional link to driver detail
}
