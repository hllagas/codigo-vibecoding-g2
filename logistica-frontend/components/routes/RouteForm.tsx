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
import { useWarehouses } from '@/hooks/useWarehouses';
import { useTransports } from '@/hooks/useTransports';
import type { RouteCreate, RouteStatus } from '@/types/route';

const routeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  origin_warehouse: z.string().min(1, 'El almacén es requerido'),
  transport: z.string().min(1, 'El transporte es requerido'),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Selecciona un estado' }),
  }),
  estimated_duration_hours: z.string(),
  started_at: z.string(),
  completed_at: z.string(),
});

type RouteFormValues = z.infer<typeof routeSchema>;

interface RouteFormProps {
  defaultValues?: Partial<RouteCreate>;
  onSubmit: (data: RouteCreate) => Promise<void>;
  isSubmitting?: boolean;
}

export function RouteForm({ defaultValues, onSubmit, isSubmitting }: RouteFormProps) {
  const { data: warehousesData } = useWarehouses({ is_active: true, page: 1 });
  const warehouses = warehousesData?.results ?? [];
  const { data: transportsData } = useTransports({ is_active: true, page: 1 });
  const transports = transportsData?.results ?? [];

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      origin_warehouse:
        defaultValues?.origin_warehouse != null ? String(defaultValues.origin_warehouse) : '',
      transport:
        defaultValues?.transport != null ? String(defaultValues.transport) : '',
      status: defaultValues?.status ?? 'planned',
      estimated_duration_hours: defaultValues?.estimated_duration_hours ?? '',
      started_at: defaultValues?.started_at ? defaultValues.started_at.slice(0, 16) : '',
      completed_at: defaultValues?.completed_at ? defaultValues.completed_at.slice(0, 16) : '',
    },
  });

  async function handleSubmit(values: RouteFormValues) {
    const data: RouteCreate = {
      name: values.name.trim(),
      origin_warehouse: parseInt(values.origin_warehouse, 10),
      transport: parseInt(values.transport, 10),
      status: values.status as RouteStatus,
      estimated_duration_hours: values.estimated_duration_hours.trim() || null,
      started_at: values.started_at ? new Date(values.started_at).toISOString() : null,
      completed_at: values.completed_at ? new Date(values.completed_at).toISOString() : null,
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
            name="origin_warehouse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Almacén origen *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v: string | null) => field.onChange(v ?? '')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona almacén" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transport"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transporte *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v: string | null) => field.onChange(v ?? '')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona transporte" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transports.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v: string | null) => field.onChange(v ?? 'planned')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="planned">Planificada</SelectItem>
                    <SelectItem value="in_progress">En progreso</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimated_duration_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración estimada (h)</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="0.0" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="started_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inicio</FormLabel>
                <FormControl>
                  <Input {...field} type="datetime-local" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="completed_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Finalización</FormLabel>
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
            'Guardar'
          )}
        </Button>
      </form>
    </Form>
  );
}
