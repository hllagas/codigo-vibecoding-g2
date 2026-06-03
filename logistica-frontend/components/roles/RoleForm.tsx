'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
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
import type { Group, GroupCreate, Permission } from '@/types/user';

const roleSchema = z.object({
  name: z.string().min(1, 'El nombre del rol es requerido'),
  permission_ids: z.array(z.number()),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormProps {
  defaultValues?: Partial<Group>;
  permissions: Permission[];
  isEdit?: boolean;
  onSubmit: (data: GroupCreate) => Promise<void>;
  isSubmitting?: boolean;
}

const APP_LABELS: Record<string, string> = {
  customers: 'Clientes',
  suppliers: 'Proveedores',
  products: 'Productos',
  warehouses: 'Almacenes',
  drivers: 'Conductores',
  transports: 'Transportes',
  routes: 'Rutas',
  shipments: 'Envíos',
  auth: 'Autenticación',
  admin: 'Administración',
};

const BUSINESS_APPS = new Set([
  'customers', 'suppliers', 'products', 'warehouses',
  'drivers', 'transports', 'routes', 'shipments',
]);

export function RoleForm({ defaultValues, permissions, isEdit, onSubmit, isSubmitting }: RoleFormProps) {
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set(BUSINESS_APPS));

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      permission_ids: defaultValues?.permissions?.map((p) => p.id) ?? [],
    },
  });

  // Group permissions by app_label, only business apps
  const byApp = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const app = p.content_type.app_label;
    if (!BUSINESS_APPS.has(app)) return acc;
    if (!acc[app]) acc[app] = [];
    acc[app].push(p);
    return acc;
  }, {});

  function toggleApp(app: string) {
    setExpandedApps((prev) => {
      const next = new Set(prev);
      if (next.has(app)) next.delete(app);
      else next.add(app);
      return next;
    });
  }

  function togglePermission(id: number) {
    const current = form.getValues('permission_ids');
    if (current.includes(id)) {
      form.setValue('permission_ids', current.filter((p) => p !== id));
    } else {
      form.setValue('permission_ids', [...current, id]);
    }
  }

  function toggleAppPermissions(app: string, allSelected: boolean) {
    const appIds = (byApp[app] ?? []).map((p) => p.id);
    const current = form.getValues('permission_ids');
    if (allSelected) {
      form.setValue('permission_ids', current.filter((id) => !appIds.includes(id)));
    } else {
      const next = new Set([...current, ...appIds]);
      form.setValue('permission_ids', Array.from(next));
    }
  }

  async function handleSubmit(values: RoleFormValues) {
    await onSubmit({ name: values.name, permission_ids: values.permission_ids });
  }

  const selectedIds = form.watch('permission_ids');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del rol *</FormLabel>
              <FormControl>
                <Input placeholder="ej. Operador de envíos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel className="text-sm">Permisos</FormLabel>
          <div className="mt-2 space-y-1 max-h-72 overflow-y-auto rounded-lg border border-border p-2">
            {Object.keys(byApp).sort().map((app) => {
              const appPerms = byApp[app];
              const selectedInApp = appPerms.filter((p) => selectedIds.includes(p.id)).length;
              const allSelected = selectedInApp === appPerms.length;
              const expanded = expandedApps.has(app);

              return (
                <div key={app} className="rounded-md">
                  {/* App header row */}
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = selectedInApp > 0 && !allSelected;
                      }}
                      onChange={() => toggleAppPermissions(app, allSelected)}
                      className="h-3.5 w-3.5 accent-primary cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-1.5 text-left"
                      onClick={() => toggleApp(app)}
                    >
                      {expanded ? (
                        <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {APP_LABELS[app] ?? app}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {selectedInApp}/{appPerms.length}
                      </span>
                    </button>
                  </div>

                  {/* Individual permissions */}
                  {expanded && (
                    <div className="ml-6 mt-0.5 space-y-0.5 pb-1">
                      {appPerms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="h-3.5 w-3.5 accent-primary cursor-pointer"
                          />
                          <span className="text-xs text-foreground">{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {Object.keys(byApp).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Cargando permisos…
              </p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
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
