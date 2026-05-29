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
import { Skeleton } from '@/components/ui/skeleton';
import type { WarehouseStock } from '@/types/warehouse';

interface WarehouseStockTableProps {
  data: WarehouseStock[];
  isLoading?: boolean;
}

export function WarehouseStockTable({ data, isLoading }: WarehouseStockTableProps) {
  const columns: ColumnDef<WarehouseStock>[] = [
    {
      accessorKey: 'product',
      header: 'Producto (ID)',
      cell: ({ row }) => row.original.product,
    },
    {
      accessorKey: 'quantity',
      header: 'Cantidad',
      cell: ({ row }) => row.original.quantity.toLocaleString('es-PE'),
    },
    {
      accessorKey: 'updated_at',
      header: 'Última actualización',
      cell: ({ row }) =>
        new Date(row.original.updated_at).toLocaleDateString('es-PE'),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground py-8"
              >
                Sin stock registrado
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
      <p className="text-xs text-muted-foreground">
        Los nombres de productos estarán disponibles cuando el módulo de Productos esté completo.
      </p>
    </div>
  );
}
