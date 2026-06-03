'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserTable } from '@/components/users/UserTable';
import { UserForm } from '@/components/users/UserForm';
import { useUsers, useGroups } from '@/hooks/useUsers';
import { useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUserMutations';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/lib/errorUtils';
import type { User, UserCreate, UserUpdate } from '@/types/user';

export default function UsersPage() {
  const router = useRouter();
  const is_superuser = useAuthStore((s) => s.is_superuser);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  useEffect(() => {
    if (!is_superuser) {
      router.replace('/dashboard');
    }
  }, [is_superuser, router]);

  const { data: users = [], isLoading, isError } = useUsers();
  const { data: groups = [] } = useGroups();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  async function handleCreate(data: UserCreate | UserUpdate) {
    try {
      await createMutation.mutateAsync(data as UserCreate);
      toast.success('Usuario creado');
      setCreateOpen(false);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleEdit(data: UserCreate | UserUpdate) {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, data: data as UserUpdate });
      toast.success('Usuario actualizado');
      setEditTarget(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Usuario eliminado');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  if (!is_superuser) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Nuevo usuario
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          Error al cargar usuarios
        </div>
      )}

      <UserTable
        data={users}
        isLoading={isLoading}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <UserForm
            groups={groups}
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <UserForm
              defaultValues={editTarget}
              groups={groups}
              isEdit
              onSubmit={handleEdit}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar usuario{' '}
            <span className="font-medium text-foreground">{deleteTarget?.username}</span>? Esta
            acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
