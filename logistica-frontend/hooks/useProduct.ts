'use client';

import { useQuery } from '@tanstack/react-query';
import { getProduct } from '@/services/productService';

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });
}
