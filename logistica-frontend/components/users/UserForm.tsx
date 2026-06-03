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
import type { Group, User, UserCreate, UserUpdate } from '@/types/user';

const userSchema = z.object({
  username: z.string().min(1, 'El username es requerido'),
  email: z.string().email('Email inválido'),
  first_name: z.string(),
  last_name: z.string(),
  password: z.string(),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  group_ids: z.array(z.number()),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  defaultValues?: Partial<User>;
  groups: Group[];
  isEdit?: boolean;
  onSubmit: (data: UserCreate | UserUpdate) => Promise<void>;
  isSubmitting?: boolean;
}

export function UserForm({ defaultValues, groups, isEdit, onSubmit, isSubmitting }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: defaultValues?.username ?? '',
      email: defaultValues?.email ?? '',
      first_name: defaultValues?.first_name ?? '',
      last_name: defaultValues?.last_name ?? '',
      password: '',
      is_active: defaultValues?.is_active ?? true,
      is_superuser: defaultValues?.is_superuser ?? false,
      group_ids: defaultValues?.groups?.map((g) => g.id) ?? [],
    },
  });

  async function handleSubmit(values: UserFormValues) {
    if (isEdit) {
      const data: UserUpdate = {
        username: values.username,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        is_active: values.is_active,
        is_superuser: values.is_superuser,
        group_ids: values.group_ids,
      };
      if (values.password) data.password = values.password;
      await onSubmit(data);
    } else {
      const data: UserCreate = {
        username: values.username,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        password: values.password,
        is_active: values.is_active,
        is_superuser: values.is_superuser,
        group_ids: values.group_ids,
      };
      await onSubmit(data);
    }
  }

  function toggleGroup(id: number) {
    const current = form.getValues('group_ids');
    if (current.includes(id)) {
      form.setValue('group_ids', current.filter((g) => g !== id));
    } else {
      form.setValue('group_ids', [...current, id]);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username *</FormLabel>
                <FormControl>
                  <Input placeholder="nombre.usuario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@empresa.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Apellido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {groups.length > 0 && (
          <FormField
            control={form.control}
            name="group_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grupos / Roles</FormLabel>
                <div className="flex flex-wrap gap-2 pt-1">
                  {groups.map((group) => {
                    const selected = field.value.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:border-primary'
                        }`}
                      >
                        {group.name}
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="user_is_active"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <FormLabel htmlFor="user_is_active" className="cursor-pointer">
                    Activo
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_superuser"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="user_is_superuser"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <FormLabel htmlFor="user_is_superuser" className="cursor-pointer">
                    Superadmin
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
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
