'use client';

import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { createGroup, updateGroup, deleteGroup } from '@/services/userService';
import type { GroupCreate, GroupUpdate } from '@/types/user';

export function useCreateGroup() {
  return useMutation({
    mutationFn: (data: GroupCreate) => createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useUpdateGroup() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GroupUpdate }) => updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteGroup() {
  return useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
