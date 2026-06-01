import type { Metadata } from 'next';
import { DashboardClientSection } from './DashboardClientSection';

export const metadata: Metadata = { title: 'Dashboard | Logística' };

export default function DashboardPage() {
  return <DashboardClientSection />;
}
