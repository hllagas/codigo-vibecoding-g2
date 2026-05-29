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
import { DriverAvailabilityBadge } from './DriverAvailabilityBadge';
import { LicenseExpiryBadge } from './LicenseExpiryBadge';
import { Pencil, Trash2 } from 'lucide-react';
import type { Driver } from '@/types/driver';

interface DriverTableProps {
  data: Driver[];
  isLoading?: boolean;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
}

function getFullName(driver: Driver): string {
  const full = [driver.user_detail.first_name, driver.user_detail.last_name]
    .filter(Boolean)
    .join(' ');
  return full || driver.user_detail.username;
}

export function DriverTable({ data, isLoading, onEdit, onDelete }: DriverTableProps) {
  const columns: ColumnDef<Driver>[] = [
    {
      id: 'full_name',
      header: 'Conductor',
      cell: ({ row }) => <span className="font-medium">{getFullName(row.original)}</span>,
    },
    {
      id: 'license_number',
      header: 'N° Licencia',
      cell: ({ row }) => row.original.license_number,
    },
    {
      id: 'license_expiry',
      header: 'Vencimiento licencia',
      cell: ({ row }) => <LicenseExpiryBadge dateStr={row.original.license_expiry} />,
    },
    {
      id: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => row.original.phone,
    },
    {
      id: 'is_available',
      header: 'Disponibilidad',
      cell: ({ row }) => <DriverAvailabilityBadge isAvailable={row.original.is_available} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar conductor"
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Eliminar conductor"
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
                No hay conductores registrados
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
