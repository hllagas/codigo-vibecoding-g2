"use client";

import { usePathname } from "next/navigation";
import { Menu, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/suppliers": "Proveedores",
  "/warehouses": "Almacenes",
  "/customers": "Clientes",
  "/products": "Productos",
  "/drivers": "Conductores",
  "/transports": "Transportes",
  "/routes": "Rutas",
  "/shipments": "Envíos",
};

function getPageTitle(pathname: string): string {
  // Check exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Check prefix match (for nested routes)
  for (const [key, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(key + "/")) return title;
  }
  return "Logística";
}

interface HeaderProps {
  onMenuToggle: () => void;
  className?: string;
}

export function Header({ onMenuToggle, className }: HeaderProps) {
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);

  const pageTitle = getPageTitle(pathname);

  // Try to decode username from JWT payload
  let username: string | null = null;
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      username = payload.username ?? payload.user ?? payload.sub ?? null;
    } catch {
      // ignore decode errors
    }
  }

  return (
    <header
      className={cn(
        "flex h-16 items-center gap-4 border-b border-border bg-background px-4",
        className
      )}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden rounded-md p-1.5 hover:bg-muted transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-lg font-semibold">{pageTitle}</h1>

      {/* User info */}
      {username && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="size-4" />
          <span>{username}</span>
        </div>
      )}
    </header>
  );
}
