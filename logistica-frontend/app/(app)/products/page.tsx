'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCreateProduct, useDeleteProduct } from '@/hooks/useProductMutations';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductForm } from '@/components/products/ProductForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/errorUtils';
import type { Product, ProductCreate, ProductListParams } from '@/types/product';

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const router = useRouter();
  const [params, setParams] = useState<ProductListParams>({ page: 1 });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { data, isLoading, isError } = useProducts(params);
  const { data: suppliersData } = useSuppliers({ page: 1 });

  const suppliersMap: Record<number, string> = {};
  for (const s of suppliersData?.results ?? []) {
    suppliersMap[s.id] = s.name;
  }

  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();

  function handleEdit(product: Product) {
    router.push(`/products/${product.id}`);
  }

  function handleDeleteClick(product: Product) {
    setProductToDelete(product);
  }

  async function handleDeleteConfirm() {
    if (!productToDelete) return;
    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      setProductToDelete(null);
      toast.success('Producto eliminado');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleCreate(data: ProductCreate) {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
      toast.success('Producto creado');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Nuevo producto</Button>
      </div>

      <ProductFilters params={params} onChange={setParams} />

      {isError && <p className="text-destructive">Error al cargar productos</p>}

      <ProductTable
        data={data?.results ?? []}
        isLoading={isLoading}
        suppliersMap={suppliersMap}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Página {params.page ?? 1} de {Math.ceil((data?.count ?? 0) / PAGE_SIZE) || 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={(params.page ?? 1) <= 1}
            onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data?.next === null}
            onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
          </DialogHeader>
          <ProductForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={productToDelete !== null}
        onOpenChange={(open) => { if (!open) setProductToDelete(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar{' '}
            <strong>{productToDelete?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToDelete(null)}>
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
