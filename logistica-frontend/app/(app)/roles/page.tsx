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
import { RoleTable } from '@/components/roles/RoleTable';
import { RoleForm } from '@/components/roles/RoleForm';
import { useGroups, usePermissions } from '@/hooks/useUsers';
import { useCreateGroup, useUpdateGroup, useDeleteGroup } from '@/hooks/useGroupMutations';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/lib/errorUtils';
import type { Group, GroupCreate } from '@/types/user';

export default function RolesPage() {
  const router = useRouter();
  const is_superuser = useAuthStore((s) => s.is_superuser);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Group | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

  useEffect(() => {
    if (!is_superuser) router.replace('/dashboard');
  }, [is_superuser, router]);

  const { data: groups = [], isLoading, isError } = useGroups();
  const { data: permissions = [] } = usePermissions();
  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup();
  const deleteMutation = useDeleteGroup();

  async function handleCreate(data: GroupCreate) {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Rol creado');
      setCreateOpen(false);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleEdit(data: GroupCreate) {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, data });
      toast.success('Rol actualizado');
      setEditTarget(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Rol eliminado');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  if (!is_superuser) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Nuevo rol
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          Error al cargar roles
        </div>
      )}

      <RoleTable
        data={groups}
        isLoading={isLoading}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo rol</DialogTitle>
          </DialogHeader>
          <RoleForm
            permissions={permissions}
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar rol</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <RoleForm
              defaultValues={editTarget}
              permissions={permissions}
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
            <DialogTitle>Eliminar rol</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar el rol{' '}
            <span className="font-medium text-foreground">{deleteTarget?.name}</span>? Los usuarios
            con este rol perderán sus permisos asociados.
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
