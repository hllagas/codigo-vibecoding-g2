'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
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
import { DatePicker } from '@/components/ui/DatePicker';
import { useCustomers } from '@/hooks/useCustomers';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useRoutes } from '@/hooks/useRoutes';
import { useProducts } from '@/hooks/useProducts';
import type { ShipmentCreate, ShipmentStatus } from '@/types/shipment';

const itemSchema = z.object({
  product: z.string().min(1, 'Selecciona un producto'),
  quantity: z
    .string()
    .min(1, 'La cantidad es requerida')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, 'Debe ser entero ≥ 1'),
  unit_price_at_shipment: z.string().min(1, 'El precio es requerido'),
});

const shipmentSchema = z.object({
  tracking_number: z.string().min(1, 'El número de seguimiento es requerido'),
  customer: z.string().min(1, 'El cliente es requerido'),
  origin_warehouse: z.string().min(1, 'El almacén de origen es requerido'),
  route: z.string(),
  destination_address: z.string().min(1, 'La dirección es requerida'),
  destination_city: z.string().min(1, 'La ciudad es requerida'),
  destination_country: z.string().min(1, 'El país es requerido'),
  status: z.enum(['pending', 'processing', 'in_transit', 'delivered', 'cancelled', 'returned']),
  scheduled_delivery_date: z.string().min(1, 'La fecha es requerida'),
  actual_delivery_date: z.string(),
  total_weight_kg: z.string().min(1, 'El peso es requerido'),
  notes: z.string(),
  items: z.array(itemSchema).min(1, 'Agrega al menos un producto'),
});

type ShipmentFormValues = z.infer<typeof shipmentSchema>;

interface ShipmentCreateFormProps {
  onSubmit: (data: ShipmentCreate) => Promise<void>;
  isSubmitting?: boolean;
}

export function ShipmentCreateForm({ onSubmit, isSubmitting }: ShipmentCreateFormProps) {
  const { data: customersData } = useCustomers({ page: 1 });
  const { data: warehousesData } = useWarehouses({ is_active: true, page: 1 });
  const { data: routesData } = useRoutes({ page: 1 });
  const { data: productsData } = useProducts({ is_active: true, page: 1 });

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      tracking_number: '',
      customer: '',
      origin_warehouse: '',
      route: 'none',
      destination_address: '',
      destination_city: '',
      destination_country: '',
      status: 'pending',
      scheduled_delivery_date: '',
      actual_delivery_date: '',
      total_weight_kg: '',
      notes: '',
      items: [{ product: '', quantity: '', unit_price_at_shipment: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  async function handleSubmit(values: ShipmentFormValues) {
    const productIds = values.items.map((i) => i.product);
    if (new Set(productIds).size !== productIds.length) {
      form.setError('items', { message: 'Hay productos duplicados en los ítems' });
      return;
    }

    const data: ShipmentCreate = {
      tracking_number: values.tracking_number.trim(),
      customer: parseInt(values.customer, 10),
      origin_warehouse: parseInt(values.origin_warehouse, 10),
      route: values.route === 'none' ? null : parseInt(values.route, 10),
      destination_address: values.destination_address.trim(),
      destination_city: values.destination_city.trim(),
      destination_country: values.destination_country.trim(),
      status: values.status as ShipmentStatus,
      scheduled_delivery_date: values.scheduled_delivery_date,
      actual_delivery_date: values.actual_delivery_date.trim() || null,
      total_weight_kg: values.total_weight_kg.trim(),
      notes: values.notes.trim() || null,
      items: values.items.map((i) => ({
        product: parseInt(i.product, 10),
        quantity: parseInt(i.quantity, 10),
        unit_price_at_shipment: i.unit_price_at_shipment.trim(),
      })),
    };
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Datos del envío
        </p>

        <FormField
          control={form.control}
          name="tracking_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>N° Seguimiento *</FormLabel>
              <FormControl>
                <Input {...field} className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select value={field.value} onValueChange={(v: string | null) => field.onChange(v ?? '')}>
                  <FormControl>
                    <SelectTrigger>
                      <span className="flex flex-1 text-left truncate text-sm">
                        {field.value
                          ? (customersData?.results.find(c => String(c.id) === field.value)?.name ?? field.value)
                          : <span className="text-muted-foreground">Selecciona cliente</span>}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customersData?.results.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="origin_warehouse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Almacén origen *</FormLabel>
                <Select value={field.value} onValueChange={(v: string | null) => field.onChange(v ?? '')}>
                  <FormControl>
                    <SelectTrigger>
                      <span className="flex flex-1 text-left truncate text-sm">
                        {field.value
                          ? (warehousesData?.results.find(w => String(w.id) === field.value)?.name ?? field.value)
                          : <span className="text-muted-foreground">Selecciona almacén</span>}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {warehousesData?.results.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
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
            name="route"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ruta</FormLabel>
                <Select value={field.value} onValueChange={(v: string | null) => field.onChange(v ?? 'none')}>
                  <FormControl>
                    <SelectTrigger>
                      <span className="flex flex-1 text-left truncate text-sm">
                        {field.value && field.value !== 'none'
                          ? (routesData?.results.find(r => String(r.id) === field.value)?.name ?? field.value)
                          : <span className="text-muted-foreground">Sin ruta</span>}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin ruta</SelectItem>
                    {routesData?.results.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="total_weight_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso total (kg) *</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="destination_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección destino *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="destination_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad destino *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destination_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País destino *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduled_delivery_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha entrega programada *</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="actual_delivery_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha entrega real</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
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
                <FormLabel>Estado</FormLabel>
                <Select value={field.value} onValueChange={(v: string | null) => field.onChange(v ?? 'pending')}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="processing">Procesando</SelectItem>
                    <SelectItem value="in_transit">En tránsito</SelectItem>
                    <SelectItem value="delivered">Entregado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="returned">Devuelto</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Items section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Productos
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product: '', quantity: '', unit_price_at_shipment: '' })}
            >
              Añadir producto
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_100px_130px_auto] gap-2 items-end">
              <FormField
                control={form.control}
                name={`items.${index}.product`}
                render={({ field: f }) => (
                  <FormItem>
                    {index === 0 && <FormLabel>Producto *</FormLabel>}
                    <Select value={f.value} onValueChange={(v: string | null) => f.onChange(v ?? '')}>
                      <FormControl>
                        <SelectTrigger>
                          <span className="flex flex-1 text-left truncate text-sm">
                            {f.value
                              ? (productsData?.results.find(p => String(p.id) === f.value)?.name ?? f.value)
                              : <span className="text-muted-foreground">Selecciona</span>}
                          </span>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productsData?.results.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field: f }) => (
                  <FormItem>
                    {index === 0 && <FormLabel>Cantidad *</FormLabel>}
                    <FormControl>
                      <Input {...f} type="number" min={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.unit_price_at_shipment`}
                render={({ field: f }) => (
                  <FormItem>
                    {index === 0 && <FormLabel>Precio unit. *</FormLabel>}
                    <FormControl>
                      <Input {...f} type="text" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className={index === 0 ? 'pt-6' : ''}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length === 1}
                  aria-label="Eliminar ítem"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {form.formState.errors.items?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creando…
            </>
          ) : (
            'Crear envío'
          )}
        </Button>
      </form>
    </Form>
  );
}
