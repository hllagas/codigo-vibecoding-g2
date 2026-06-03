'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Pencil, Trash2 } from 'lucide-react';
import type { Product } from '@/types/product';

interface ProductTableProps {
  data: Product[];
  isLoading?: boolean;
  suppliersMap: Record<number, string>;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductTable({ data, isLoading, suppliersMap, onEdit, onDelete }: ProductTableProps) {
  const columns: ColumnDef<Product>[] = [
    {
      id: 'name',
      header: 'Producto',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: 'sku',
      header: 'SKU',
      cell: ({ row }) => row.original.sku,
    },
    {
      id: 'category',
      header: 'Categoría',
      cell: ({ row }) => row.original.category,
    },
    {
      id: 'unit_price',
      header: 'Precio unitario',
      cell: ({ row }) => parseFloat(row.original.unit_price).toFixed(2),
    },
    {
      id: 'weight_kg',
      header: 'Peso (kg)',
      cell: ({ row }) => parseFloat(row.original.weight_kg).toFixed(3),
    },
    {
      id: 'supplier',
      header: 'Proveedor',
      cell: ({ row }) =>
        row.original.supplier !== null
          ? (suppliersMap[row.original.supplier] ?? `ID ${row.original.supplier}`)
          : '—',
    },
    {
      id: 'is_active',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge isActive={row.original.is_active} />,
    },
  ];

  if (onEdit || onDelete) {
    columns.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" aria-label="Editar producto" onClick={() => onEdit(row.original)}>
              <Pencil className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" aria-label="Eliminar producto" className="text-destructive hover:text-destructive" onClick={() => onDelete(row.original)}>
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      ),
    });
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.id}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                No hay productos registrados
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
