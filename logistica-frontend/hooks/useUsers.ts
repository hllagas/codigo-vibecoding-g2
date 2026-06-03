'use client';

import { useQuery } from '@tanstack/react-query';
import { listUsers, listGroups, listPermissions } from '@/services/userService';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });
}

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: listGroups,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: listPermissions,
    staleTime: 10 * 60 * 1000, // permissions rarely change
  });
}
