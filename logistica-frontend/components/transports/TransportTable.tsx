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
import { TransportTypeBadge } from './TransportTypeBadge';
import { Pencil, Trash2 } from 'lucide-react';
import type { Transport } from '@/types/transport';

interface TransportTableProps {
  data: Transport[];
  isLoading?: boolean;
  onEdit?: (transport: Transport) => void;
  onDelete?: (transport: Transport) => void;
}

export function TransportTable({ data, isLoading, onEdit, onDelete }: TransportTableProps) {
  const columns: ColumnDef<Transport>[] = [
    {
      id: 'name',
      header: 'Vehículo',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: 'plate_number',
      header: 'Matrícula',
      cell: ({ row }) => row.original.plate_number,
    },
    {
      id: 'transport_type',
      header: 'Tipo',
      cell: ({ row }) => <TransportTypeBadge transportType={row.original.transport_type} />,
    },
    {
      id: 'capacity_kg',
      header: 'Capacidad',
      cell: ({ row }) => `${parseFloat(row.original.capacity_kg).toFixed(2)} kg`,
    },
    {
      id: 'driver',
      header: 'Conductor',
      cell: ({ row }) =>
        row.original.driver_detail !== null
          ? row.original.driver_detail.license_number
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
            <Button variant="ghost" size="icon" aria-label="Editar transporte" onClick={() => onEdit(row.original)}>
              <Pencil className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" aria-label="Eliminar transporte" className="text-destructive hover:text-destructive" onClick={() => onDelete(row.original)}>
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
                No hay transportes registrados
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
