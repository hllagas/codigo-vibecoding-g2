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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDrivers } from '@/hooks/useDrivers';
import type { TransportCreate, TransportType } from '@/types/transport';

const transportSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  plate_number: z.string().min(1, 'La matrícula es requerida'),
  transport_type: z.enum(['truck', 'van', 'motorcycle', 'bicycle'], {
    errorMap: () => ({ message: 'Selecciona un tipo de transporte' }),
  }),
  capacity_kg: z.string().min(1, 'La capacidad es requerida'),
  driver: z.string(),
  is_active: z.boolean(),
});

type TransportFormValues = z.infer<typeof transportSchema>;

interface TransportFormProps {
  defaultValues?: Partial<TransportCreate>;
  onSubmit: (data: TransportCreate) => Promise<void>;
  isSubmitting?: boolean;
}

export function TransportForm({ defaultValues, onSubmit, isSubmitting }: TransportFormProps) {
  const { data: driversData } = useDrivers({ is_available: true, page: 1 });
  const drivers = driversData?.results ?? [];

  const form = useForm<TransportFormValues>({
    resolver: zodResolver(transportSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      plate_number: defaultValues?.plate_number ?? '',
      transport_type: defaultValues?.transport_type ?? 'truck',
      capacity_kg: defaultValues?.capacity_kg ?? '',
      driver: defaultValues?.driver != null ? String(defaultValues.driver) : 'none',
      is_active: defaultValues?.is_active ?? true,
    },
  });

  async function handleSubmit(values: TransportFormValues) {
    const data: TransportCreate = {
      name: values.name.trim(),
      plate_number: values.plate_number.trim().toUpperCase(),
      transport_type: values.transport_type as TransportType,
      capacity_kg: values.capacity_kg.trim(),
      driver: values.driver === 'none' ? null : parseInt(values.driver, 10),
      is_active: values.is_active,
    };
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="plate_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matrícula *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transport_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value: string | null) => field.onChange(value ?? 'truck')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="truck">Camión</SelectItem>
                    <SelectItem value="van">Furgoneta</SelectItem>
                    <SelectItem value="motorcycle">Moto</SelectItem>
                    <SelectItem value="bicycle">Bicicleta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacity_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidad (kg) *</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="driver"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conductor</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value: string | null) => field.onChange(value ?? 'none')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin conductor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin conductor</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.license_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="size-4 rounded border-input"
                />
              </FormControl>
              <FormLabel className="!mt-0">Activo</FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Guardando…
            </>
          ) : (
            'Guardar'
          )}
        </Button>
      </form>
    </Form>
  );
}
