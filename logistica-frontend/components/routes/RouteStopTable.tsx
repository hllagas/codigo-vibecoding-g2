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
import { Pencil, Trash2 } from 'lucide-react';
import type { RouteStop } from '@/types/route';

interface RouteStopTableProps {
  data: RouteStop[];
  isLoading?: boolean;
  onEdit: (stop: RouteStop) => void;
  onDelete: (stop: RouteStop) => void;
}

export function RouteStopTable({ data, isLoading, onEdit, onDelete }: RouteStopTableProps) {
  const sorted = [...data].sort((a, b) => a.stop_order - b.stop_order);

  const columns: ColumnDef<RouteStop>[] = [
    {
      id: 'stop_order',
      header: 'Orden',
      cell: ({ row }) => row.original.stop_order,
    },
    {
      id: 'address',
      header: 'Dirección',
      cell: ({ row }) => row.original.address,
    },
    {
      id: 'city',
      header: 'Ciudad',
      cell: ({ row }) => row.original.city,
    },
    {
      id: 'estimated_arrival',
      header: 'Llegada estimada',
      cell: ({ row }) =>
        row.original.estimated_arrival
          ? new Date(row.original.estimated_arrival).toLocaleString()
          : '—',
    },
    {
      id: 'actual_arrival',
      header: 'Llegada real',
      cell: ({ row }) =>
        row.original.actual_arrival
          ? new Date(row.original.actual_arrival).toLocaleString()
          : '—',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar parada"
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Eliminar parada"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: sorted,
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
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.id}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-6">
                No hay paradas registradas
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
