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
import { DatePicker } from '@/components/ui/DatePicker';
import type { DriverCreate } from '@/types/driver';

const driverSchema = z.object({
  user: z.string().min(1, 'El ID de usuario es requerido').refine(
    (v) => Number.isInteger(Number(v)) && Number(v) > 0,
    'Debe ser un número entero positivo'
  ),
  license_number: z.string().min(1, 'El número de licencia es requerido'),
  license_expiry: z.string().min(1, 'La fecha de vencimiento es requerida'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  is_available: z.boolean(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

interface DriverFormProps {
  defaultValues?: Partial<DriverCreate>;
  onSubmit: (data: DriverCreate) => Promise<void>;
  isSubmitting?: boolean;
}

export function DriverForm({ defaultValues, onSubmit, isSubmitting }: DriverFormProps) {
  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      user: defaultValues?.user != null ? String(defaultValues.user) : '',
      license_number: defaultValues?.license_number ?? '',
      license_expiry: defaultValues?.license_expiry ?? '',
      phone: defaultValues?.phone ?? '',
      is_available: defaultValues?.is_available ?? true,
    },
  });

  async function handleSubmit(values: DriverFormValues) {
    const data: DriverCreate = {
      user: parseInt(values.user, 10),
      license_number: values.license_number.trim(),
      license_expiry: values.license_expiry,
      phone: values.phone.trim(),
      is_available: values.is_available,
    };
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID de usuario *</FormLabel>
              <FormControl>
                <Input {...field} type="number" placeholder="ej. 3" min={1} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° Licencia *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="license_expiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimiento licencia *</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono *</FormLabel>
              <FormControl>
                <Input {...field} type="tel" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_available"
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
              <FormLabel className="!mt-0">Disponible</FormLabel>
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
