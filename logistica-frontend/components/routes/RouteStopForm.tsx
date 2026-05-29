'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { RouteStopCreate } from '@/types/route';

const stopSchema = z.object({
  stop_order: z
    .string()
    .min(1, 'El orden es requerido')
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) >= 1,
      'Debe ser un entero positivo'
    ),
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  latitude: z.string(),
  longitude: z.string(),
  estimated_arrival: z.string(),
  actual_arrival: z.string(),
});

type StopFormValues = z.infer<typeof stopSchema>;

interface RouteStopFormProps {
  defaultValues?: Partial<RouteStopCreate>;
  onSubmit: (data: RouteStopCreate) => Promise<void>;
  isSubmitting?: boolean;
}

export function RouteStopForm({ defaultValues, onSubmit, isSubmitting }: RouteStopFormProps) {
  const form = useForm<StopFormValues>({
    resolver: zodResolver(stopSchema),
    defaultValues: {
      stop_order: defaultValues?.stop_order != null ? String(defaultValues.stop_order) : '',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      latitude: defaultValues?.latitude ?? '',
      longitude: defaultValues?.longitude ?? '',
      estimated_arrival: defaultValues?.estimated_arrival
        ? defaultValues.estimated_arrival.slice(0, 16)
        : '',
      actual_arrival: defaultValues?.actual_arrival
        ? defaultValues.actual_arrival.slice(0, 16)
        : '',
    },
  });

  async function handleSubmit(values: StopFormValues) {
    const data: RouteStopCreate = {
      stop_order: parseInt(values.stop_order, 10),
      address: values.address.trim(),
      city: values.city.trim(),
      latitude: values.latitude.trim() || null,
      longitude: values.longitude.trim() || null,
      estimated_arrival: values.estimated_arrival
        ? new Date(values.estimated_arrival).toISOString()
        : null,
      actual_arrival: values.actual_arrival
        ? new Date(values.actual_arrival).toISOString()
        : null,
    };
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="stop_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orden *</FormLabel>
              <FormControl>
                <Input {...field} type="number" min={1} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="-90 a 90" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="-180 a 180" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimated_arrival"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Llegada estimada</FormLabel>
                <FormControl>
                  <Input {...field} type="datetime-local" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="actual_arrival"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Llegada real</FormLabel>
                <FormControl>
                  <Input {...field} type="datetime-local" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Guardando…
            </>
          ) : (
            'Guardar parada'
          )}
        </Button>
      </form>
    </Form>
  );
}
