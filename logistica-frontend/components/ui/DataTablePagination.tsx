'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTablePaginationProps {
  count: number;
  page: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  pageSize?: number;
}

export function DataTablePagination({
  count,
  page,
  hasPrevious,
  hasNext,
  onPrev,
  onNext,
  pageSize = 20,
}: DataTablePaginationProps) {
  if (count === 0) return null;

  const totalPages = Math.ceil(count / pageSize);
  const from = Math.min((page - 1) * pageSize + 1, count);
  const to = Math.min(page * pageSize, count);

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground tabular-nums">
        {from}–{to} de{' '}
        <span className="font-medium text-foreground">{count}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevious}
          onClick={onPrev}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <span className="text-xs tabular-nums text-muted-foreground min-w-[3rem] text-center select-none">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={onNext}
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
