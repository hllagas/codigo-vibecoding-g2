'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
