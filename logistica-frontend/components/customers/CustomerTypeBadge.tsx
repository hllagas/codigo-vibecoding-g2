'use client';

import { Badge } from '@/components/ui/badge';
import type { CustomerType } from '@/types/customer';

interface CustomerTypeBadgeProps {
  type: CustomerType;
}

export function CustomerTypeBadge({ type }: CustomerTypeBadgeProps) {
  if (type === 'company') {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        Empresa
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-800 border-green-200">
      Individual
    </Badge>
  );
}
