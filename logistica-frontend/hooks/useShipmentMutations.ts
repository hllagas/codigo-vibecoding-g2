'use client';

import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import {
  createShipment,
  updateShipment,
  deleteShipment,
  updateShipmentStatus,
} from '@/services/shipmentService';
import type { ShipmentCreate, ShipmentUpdate, ShipmentStatus } from '@/types/shipment';

export function useCreateShipment() {
  return useMutation({
    mutationFn: (data: ShipmentCreate) => createShipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });
}

export function useUpdateShipment() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShipmentUpdate }) => updateShipment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments', id] });
    },
  });
}

export function useDeleteShipment() {
  return useMutation({
    mutationFn: (id: number) => deleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });
}

export function useUpdateShipmentStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ShipmentStatus }) =>
      updateShipmentStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments', id] });
    },
  });
}
