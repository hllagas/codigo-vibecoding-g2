'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';

type SheetSide = 'top' | 'right' | 'bottom' | 'left';

const SIDE_CLASSES: Record<SheetSide, string> = {
  top: 'top-0 inset-x-0 border-b rounded-b-xl data-open:slide-in-from-top data-closed:slide-out-to-top',
  right: 'right-0 inset-y-0 w-4/5 max-w-sm border-l rounded-l-xl data-open:slide-in-from-right data-closed:slide-out-to-right',
  bottom: 'bottom-0 inset-x-0 border-t rounded-t-xl max-h-[85dvh] data-open:slide-in-from-bottom data-closed:slide-out-to-bottom',
  left: 'left-0 inset-y-0 w-4/5 max-w-sm border-r rounded-r-xl data-open:slide-in-from-left data-closed:slide-out-to-left',
};

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/60 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

interface SheetContentProps extends DialogPrimitive.Popup.Props {
  side?: SheetSide;
  showCloseButton?: boolean;
}

function SheetContent({
  side = 'right',
  className,
  children,
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 flex flex-col bg-background shadow-2xl outline-none',
          'duration-200 data-open:animate-in data-closed:animate-out data-closed:duration-150',
          SIDE_CLASSES[side],
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1 px-5 pt-4 pb-3 border-b border-border/50', className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="sheet-title"
      className={cn('font-semibold text-sm text-foreground', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="sheet-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-body"
      className={cn('flex-1 overflow-y-auto px-5 py-4', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('flex items-center gap-2 px-5 py-4 border-t border-border/50', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
};
