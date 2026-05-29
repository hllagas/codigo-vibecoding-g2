'use client';

import { Badge } from '@/components/ui/badge';
import { getLicenseExpiryStatus } from '@/lib/licenseExpiry';

interface LicenseExpiryBadgeProps {
  dateStr: string;
}

export function LicenseExpiryBadge({ dateStr }: LicenseExpiryBadgeProps) {
  const status = getLicenseExpiryStatus(dateStr);

  return (
    <span className="flex items-center gap-2">
      <span>{dateStr}</span>
      {status === 'expired' && (
        <Badge variant="destructive">Vencida</Badge>
      )}
      {status === 'expiring' && (
        <Badge variant="outline" className="border-orange-400 text-orange-600">
          Por vencer
        </Badge>
      )}
    </span>
  );
}
