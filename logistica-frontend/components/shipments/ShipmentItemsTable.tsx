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
import type { ShipmentItem } from '@/types/shipment';
import { ProductImage } from '@/components/ui/ProductImage';

interface ProductInfo {
  name: string;
  image_url: string | null;
}

interface ShipmentItemsTableProps {
  items: ShipmentItem[];
  productsMap: Record<number, ProductInfo>;
}

export function ShipmentItemsTable({ items, productsMap }: ShipmentItemsTableProps) {
  const columns: ColumnDef<ShipmentItem>[] = [
    {
      id: 'product',
      header: 'Producto',
      cell: ({ row }) => {
        const info = productsMap[row.original.product];
        return (
          <div className="flex items-center gap-2">
            <ProductImage
              src={info?.image_url}
              alt={info?.name ?? `ID ${row.original.product}`}
              size="sm"
            />
            <span>{info?.name ?? `ID ${row.original.product}`}</span>
          </div>
        );
      },
    },
    {
      id: 'quantity',
      header: 'Cantidad',
      cell: ({ row }) => row.original.quantity,
    },
    {
      id: 'unit_price',
      header: 'Precio unit.',
      cell: ({ row }) => parseFloat(row.original.unit_price_at_shipment).toFixed(2),
    },
    {
      id: 'total',
      header: 'Total',
      cell: ({ row }) =>
        (row.original.quantity * parseFloat(row.original.unit_price_at_shipment)).toFixed(2),
    },
  ];

  const table = useReactTable({
    data: items,
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
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-6">
                Sin productos
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
