'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'size-9',
  md: 'size-16',
  lg: 'size-32',
};

export function ProductImage({ src, alt, size = 'sm', className }: ProductImageProps) {
  const [error, setError] = useState(false);
  const cls = sizeMap[size];

  if (!src || error) {
    return (
      <div
        className={cn(
          cls,
          'flex items-center justify-center rounded bg-muted text-muted-foreground shrink-0',
          className,
        )}
      >
        <Package className="size-1/2" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={cn(cls, 'rounded object-cover shrink-0', className)}
    />
  );
}
