import type { Driver } from '@/types/driver';
import type {
  DateRange,
  DatePreset,
  TimeSeriesPoint,
  ChartDataPoint,
  DeliveryPerformancePoint,
  LicenseExpiryItem,
} from '@/types/dashboard';

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getDateRange(preset: DatePreset): DateRange {
  const today = new Date();
  if (preset === '7d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 7);
    return { dateFrom: formatDate(from), dateTo: formatDate(today) };
  }
  if (preset === '30d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    return { dateFrom: formatDate(from), dateTo: formatDate(today) };
  }
  if (preset === '90d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 90);
    return { dateFrom: formatDate(from), dateTo: formatDate(today) };
  }
  // 'custom' — caller provides dates; return today range as fallback
  return { dateFrom: formatDate(today), dateTo: formatDate(today) };
}

export function groupByStatus<T extends { status: string }>(items: T[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    result[item.status] = (result[item.status] ?? 0) + 1;
  }
  return result;
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

export function groupByWeek(items: Array<{ created_at: string }>): TimeSeriesPoint[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const d = new Date(item.created_at);
    const key = getISOWeek(d);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ period, count }));
}

export function groupByMonth(items: Array<{ created_at: string }>): TimeSeriesPoint[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = item.created_at.slice(0, 7); // "YYYY-MM"
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ period, count }));
}

export function groupByCity(shipments: Array<{ destination_city: string }>): ChartDataPoint[] {
  const counts: Record<string, number> = {};
  for (const s of shipments) {
    counts[s.destination_city] = (counts[s.destination_city] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));
}

export function groupByCustomerName(
  shipments: Array<{ customer: number }>,
  customersMap: Record<number, string>,
): ChartDataPoint[] {
  const counts: Record<number, number> = {};
  for (const s of shipments) {
    counts[s.customer] = (counts[s.customer] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([idStr, value]) => ({
      name: customersMap[Number(idStr)] ?? `Cliente ${idStr}`,
      value,
    }));
}

export function groupByProductName(
  items: Array<{ product: number; quantity: number }>,
  productsMap: Record<number, string>,
): ChartDataPoint[] {
  const totals: Record<number, number> = {};
  for (const item of items) {
    totals[item.product] = (totals[item.product] ?? 0) + item.quantity;
  }
  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([idStr, value]) => ({
      name: productsMap[Number(idStr)] ?? `Producto ${idStr}`,
      value,
    }));
}

export function groupByCategory(
  items: Array<{ product: number; quantity: number; unit_price_at_shipment: string }>,
  productsMap: Record<number, { name: string; category: string }>,
): ChartDataPoint[] {
  const totals: Record<string, number> = {};
  for (const item of items) {
    const prod = productsMap[item.product];
    if (!prod) continue;
    const revenue = item.quantity * parseFloat(item.unit_price_at_shipment);
    totals[prod.category] = (totals[prod.category] ?? 0) + revenue;
  }
  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
}

export function computeDeliveryPerformance(
  shipments: Array<{ scheduled_delivery_date: string; actual_delivery_date: string | null; created_at: string }>,
): DeliveryPerformancePoint[] {
  const delivered = shipments.filter((s) => s.actual_delivery_date != null);
  const byPeriod: Record<string, { onTime: number; delayed: number }> = {};
  for (const s of delivered) {
    const period = s.created_at.slice(0, 7);
    if (!byPeriod[period]) {
      byPeriod[period] = { onTime: 0, delayed: 0 };
    }
    if (s.actual_delivery_date! <= s.scheduled_delivery_date) {
      byPeriod[period].onTime += 1;
    } else {
      byPeriod[period].delayed += 1;
    }
  }
  return Object.entries(byPeriod)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, { onTime, delayed }]) => ({ period, onTime, delayed }));
}

export function computeCumulativeCustomers(
  customers: Array<{ created_at: string }>,
): TimeSeriesPoint[] {
  const sorted = [...customers].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const byMonth: Record<string, number> = {};
  for (const c of sorted) {
    const key = c.created_at.slice(0, 7);
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  }
  const periods = Object.keys(byMonth).sort();
  let running = 0;
  return periods.map((period) => {
    running += byMonth[period];
    return { period, count: running };
  });
}

export function computeLicenseExpiry(drivers: Driver[], daysAhead: 30 | 60 | 90): LicenseExpiryItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return drivers
    .map((driver) => {
      const expiry = new Date(driver.license_expiry);
      expiry.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / 86400000);
      return {
        driver,
        daysUntilExpiry,
      };
    })
    .filter(({ daysUntilExpiry }) => daysUntilExpiry <= daysAhead)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    .map(({ driver, daysUntilExpiry }) => ({
      name: `${driver.user_detail.first_name} ${driver.user_detail.last_name}`,
      value: daysUntilExpiry,
    }));
}
