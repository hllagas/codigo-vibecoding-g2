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
import { RouteStatusBadge } from './RouteStatusBadge';
import { Pencil, Trash2 } from 'lucide-react';
import type { Route } from '@/types/route';

interface RouteTableProps {
  data: Route[];
  isLoading?: boolean;
  warehousesMap: Record<number, string>;
  transportsMap: Record<number, string>;
  onEdit?: (route: Route) => void;
  onDelete?: (route: Route) => void;
}

export function RouteTable({
  data,
  isLoading,
  warehousesMap,
  transportsMap,
  onEdit,
  onDelete,
}: RouteTableProps) {
  const columns: ColumnDef<Route>[] = [
    {
      id: 'name',
      header: 'Ruta',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: 'origin_warehouse',
      header: 'Almacén origen',
      cell: ({ row }) =>
        warehousesMap[row.original.origin_warehouse] ?? `ID ${row.original.origin_warehouse}`,
    },
    {
      id: 'transport',
      header: 'Transporte',
      cell: ({ row }) =>
        transportsMap[row.original.transport] ?? `ID ${row.original.transport}`,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: ({ row }) => <RouteStatusBadge status={row.original.status} />,
    },
    {
      id: 'estimated_duration_hours',
      header: 'Duración est.',
      cell: ({ row }) =>
        row.original.estimated_duration_hours !== null
          ? `${parseFloat(row.original.estimated_duration_hours).toFixed(1)} h`
          : '—',
    },
    {
      id: 'started_at',
      header: 'Inicio',
      cell: ({ row }) =>
        row.original.started_at
          ? new Date(row.original.started_at).toLocaleDateString()
          : '—',
    },
  ];

  if (onEdit || onDelete) {
    columns.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" aria-label="Editar ruta" onClick={() => onEdit(row.original)}>
              <Pencil className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" aria-label="Eliminar ruta" className="text-destructive hover:text-destructive" onClick={() => onDelete(row.original)}>
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
                No hay rutas registradas
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
