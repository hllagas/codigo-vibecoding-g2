'use client';

import { useQuery } from '@tanstack/react-query';
import { listSuppliers } from '@/services/supplierService';
import type { SupplierListParams } from '@/types/supplier';

export function useSuppliers(params?: SupplierListParams) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => listSuppliers(params),
  });
}
