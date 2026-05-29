'use client';

import { useQuery } from '@tanstack/react-query';
import { listProducts } from '@/services/productService';
import type { ProductListParams } from '@/types/product';

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => listProducts(params),
  });
}
