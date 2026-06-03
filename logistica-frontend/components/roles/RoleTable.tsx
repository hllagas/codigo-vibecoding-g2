'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import type { Group } from '@/types/user';

interface RoleTableProps {
  data: Group[];
  isLoading?: boolean;
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
}

export function RoleTable({ data, isLoading, onEdit, onDelete }: RoleTableProps) {
  const columns: ColumnDef<Group>[] = [
    {
      accessorKey: 'name',
      header: 'Rol',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: 'permissions_count',
      header: 'Permisos',
      cell: ({ row }) => {
        const count = row.original.permissions.length;
        return (
          <Badge variant="secondary" className="text-xs">
            {count} {count === 1 ? 'permiso' : 'permisos'}
          </Badge>
        );
      },
    },
    {
      id: 'permissions_preview',
      header: 'Apps con acceso',
      cell: ({ row }) => {
        const apps = [...new Set(row.original.permissions.map((p) => p.content_type.app_label))];
        if (apps.length === 0) return <span className="text-muted-foreground text-xs">Sin permisos</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {apps.slice(0, 4).map((app) => (
              <Badge key={app} variant="outline" className="text-xs capitalize">
                {app}
              </Badge>
            ))}
            {apps.length > 4 && (
              <Badge variant="outline" className="text-xs">+{apps.length - 4}</Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Editar rol"
            onClick={() => onEdit(row.original)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Eliminar rol"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 />
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
          Array.from({ length: 4 }).map((_, i) => (
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
              No hay roles creados
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
  );
}
