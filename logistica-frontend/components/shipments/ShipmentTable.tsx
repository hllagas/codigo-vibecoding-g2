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
import { ShipmentStatusBadge } from './ShipmentStatusBadge';
import { Pencil, Trash2 } from 'lucide-react';
import type { Shipment } from '@/types/shipment';

interface ShipmentTableProps {
  data: Shipment[];
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  customersMap: Record<number, string>;
  onEdit?: (shipment: Shipment) => void;
  onDelete?: (shipment: Shipment) => void;
}

export function ShipmentTable({ data, isLoading, hasActiveFilters, customersMap, onEdit, onDelete }: ShipmentTableProps) {
  const columns: ColumnDef<Shipment>[] = [
    {
      id: 'tracking_number',
      header: 'N° Seguimiento',
      cell: ({ row }) => (
        <span className="font-medium font-mono text-sm">{row.original.tracking_number}</span>
      ),
    },
    {
      id: 'customer',
      header: 'Cliente',
      cell: ({ row }) =>
        customersMap[row.original.customer] ?? `ID ${row.original.customer}`,
    },
    {
      id: 'destination_city',
      header: 'Ciudad destino',
      cell: ({ row }) => row.original.destination_city,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: ({ row }) => <ShipmentStatusBadge status={row.original.status} />,
    },
    {
      id: 'scheduled_delivery_date',
      header: 'Entrega programada',
      cell: ({ row }) => row.original.scheduled_delivery_date,
    },
    {
      id: 'total_weight_kg',
      header: 'Peso total',
      cell: ({ row }) => `${parseFloat(row.original.total_weight_kg).toFixed(2)} kg`,
    },
  ];

  if (onEdit || onDelete) {
    columns.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" aria-label="Editar envío" onClick={() => onEdit(row.original)}>
              <Pencil className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" aria-label="Eliminar envío" className="text-destructive hover:text-destructive" onClick={() => onDelete(row.original)}>
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
                {hasActiveFilters
                  ? 'Sin resultados. Prueba con otros filtros.'
                  : 'No hay envíos registrados.'}
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
