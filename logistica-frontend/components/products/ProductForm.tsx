'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
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
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useUploadProductImage } from '@/hooks/useProductMutations';
import { ProductImage } from '@/components/ui/ProductImage';
import { getApiError } from '@/lib/errorUtils';
import type { ProductCreate } from '@/types/product';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string(),
  sku: z.string().min(1, 'El SKU es requerido'),
  category: z.string().min(1, 'La categoría es requerida'),
  unit_price: z.string().min(1, 'El precio es requerido'),
  weight_kg: z.string().min(1, 'El peso es requerido'),
  supplier: z.string(),
  is_active: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  defaultValues?: Partial<ProductCreate>;
  onSubmit: (data: ProductCreate) => Promise<void>;
  isSubmitting?: boolean;
  productId?: number;
  currentImageUrl?: string | null;
}

export function ProductForm({ defaultValues, onSubmit, isSubmitting, productId, currentImageUrl }: ProductFormProps) {
  const { data: suppliersData } = useSuppliers({ is_active: true, page: 1 });
  const uploadMutation = useUploadProductImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [liveImageUrl, setLiveImageUrl] = useState<string | null | undefined>(currentImageUrl);
  const suppliers = suppliersData?.results ?? [];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      sku: defaultValues?.sku ?? '',
      category: defaultValues?.category ?? '',
      unit_price: defaultValues?.unit_price ?? '',
      weight_kg: defaultValues?.weight_kg ?? '',
      supplier: defaultValues?.supplier != null ? String(defaultValues.supplier) : 'none',
      is_active: defaultValues?.is_active ?? true,
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!selectedFile || productId === undefined) return;
    try {
      const updated = await uploadMutation.mutateAsync({ id: productId, file: selectedFile });
      setLiveImageUrl(updated.image_url);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Imagen actualizada');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleSubmit(values: ProductFormValues) {
    const data: ProductCreate = {
      name: values.name,
      description: values.description.trim() === '' ? null : values.description.trim(),
      sku: values.sku.trim(),
      category: values.category.trim(),
      unit_price: values.unit_price.trim(),
      weight_kg: values.weight_kg.trim(),
      supplier: values.supplier === 'none' ? null : parseInt(values.supplier, 10),
      is_active: values.is_active,
    };
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Row 1: name */}
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

        {/* Row 2: sku + category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 3: unit_price + weight_kg */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio unitario *</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg) *</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="0.000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 4: supplier + description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value: string | null) => field.onChange(value ?? 'none')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <span className="flex flex-1 text-left truncate text-sm">
                        {field.value && field.value !== 'none'
                          ? (suppliers.find(s => String(s.id) === field.value)?.name ?? field.value)
                          : <span className="text-muted-foreground">Sin proveedor</span>}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 5: is_active */}
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

        {productId !== undefined && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Imagen del producto</p>
              <div className="flex items-center gap-4">
                <ProductImage src={liveImageUrl} alt="Imagen del producto" size="md" />
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? selectedFile.name : 'Seleccionar imagen'}
                  </Button>
                  {selectedFile && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={uploadMutation.isPending}
                      onClick={handleUpload}
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Subiendo…
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 size-4" />
                          Subir imagen
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

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
