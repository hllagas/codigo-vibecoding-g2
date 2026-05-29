'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useProduct } from '@/hooks/useProduct';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useUpdateProduct, useDeleteProduct } from '@/hooks/useProductMutations';
import { ProductForm } from '@/components/products/ProductForm';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { ProductCreate } from '@/types/product';

export default function ProductDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = parseInt(idParam, 10);
  const router = useRouter();

  const { data: product, isLoading, isError } = useProduct(id);
  const { data: suppliersData } = useSuppliers({ page: 1 });
  const suppliersMap: Record<number, string> = {};
  for (const s of suppliersData?.results ?? []) {
    suppliersMap[s.id] = s.name;
  }

  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function handleUpdate(data: ProductCreate) {
    await updateMutation.mutateAsync({ id, data });
    setIsEditing(false);
    toast.success('Producto actualizado');
  }

  async function handleDeleteConfirm() {
    await deleteMutation.mutateAsync(id);
    router.push('/products');
    toast.success('Producto eliminado');
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Producto no encontrado</p>
        <Button variant="link" className="px-0" onClick={() => router.push('/products')}>
          ← Volver a productos
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar producto</h1>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
        <ProductForm
          defaultValues={product}
          onSubmit={handleUpdate}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="link" className="px-0" onClick={() => router.push('/products')}>
            ← Productos
          </Button>
          <h1 className="text-2xl font-bold">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditing(true)}>Editar</Button>
          <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            Eliminar
          </Button>
        </div>
      </div>

      <Separator />

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted-foreground">SKU</dt>
          <dd className="font-medium">{product.sku}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Categoría</dt>
          <dd>{product.category}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Precio unitario</dt>
          <dd>{parseFloat(product.unit_price).toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Peso (kg)</dt>
          <dd>{parseFloat(product.weight_kg).toFixed(3)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Proveedor</dt>
          <dd>
            {product.supplier !== null
              ? (suppliersMap[product.supplier] ?? `ID ${product.supplier}`)
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Estado</dt>
          <dd>
            <StatusBadge isActive={product.is_active} />
          </dd>
        </div>
        <div className="col-span-full">
          <dt className="text-sm text-muted-foreground">Descripción</dt>
          <dd>{product.description ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Creado</dt>
          <dd className="text-sm">{new Date(product.created_at).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Actualizado</dt>
          <dd className="text-sm">{new Date(product.updated_at).toLocaleString()}</dd>
        </div>
      </dl>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar <strong>{product.name}</strong>? Esta acción no
            se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
