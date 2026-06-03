'use client';

import { useAuthStore } from '@/store/authStore';
import { useProfile } from '@/hooks/useProfile';

export function useUserPermissions() {
  const is_superuser = useAuthStore((s) => s.is_superuser);
  const { data: profile, isLoading } = useProfile();

  if (is_superuser) {
    return { can: (_codename: string) => true, isLoading: false };
  }

  if (isLoading || !profile) {
    return { can: (_codename: string) => false, isLoading: true };
  }

  const codenameSet = new Set(
    profile.groups.flatMap((g) => g.permissions.map((p) => p.codename))
  );

  return {
    can: (codename: string) => codenameSet.has(codename),
    isLoading: false,
  };
}
