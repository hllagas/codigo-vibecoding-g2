"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/suppliers": "Proveedores",
  "/warehouses": "Almacenes",
  "/customers": "Clientes",
  "/products": "Productos",
  "/drivers": "Conductores",
  "/transports": "Transportes",
  "/routes": "Rutas",
  "/shipments": "Envíos",
  "/profile": "Mi perfil",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
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
  const { logout } = useAuth();

  const pageTitle = getPageTitle(pathname);

  let username: string | null = null;
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      username = payload.username ?? payload.user ?? payload.sub ?? null;
    } catch {
      // ignore decode errors
    }
  }

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "U";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4",
        className
      )}
    >
      {/* Mobile hamburger */}
      <motion.button
        onClick={onMenuToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="lg:hidden flex items-center justify-center rounded-md p-2 min-h-10 min-w-10 hover:bg-muted transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </motion.button>

      {/* Page title */}
      <motion.h1
        key={pathname}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="flex-1 text-lg font-semibold"
      >
        {pageTitle}
      </motion.h1>

      {/* Profile dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center rounded-full p-1 min-h-10 min-w-10 ring-2 ring-transparent hover:ring-border transition-all focus-visible:outline-none focus-visible:ring-primary"
            aria-label="Menú de usuario"
          >
            <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary select-none">
              {initials}
            </div>
          </motion.button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-52 p-1">
          {/* User identity */}
          <div className="px-3 py-2.5 border-b border-border mb-1">
            <p className="text-sm font-semibold truncate">{username ?? "Usuario"}</p>
            <p className="text-xs text-muted-foreground">Cuenta activa</p>
          </div>

          {/* Menu items */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <User className="size-4 text-muted-foreground" />
            Mi perfil
          </Link>

          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors mt-0.5"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </PopoverContent>
      </Popover>
    </motion.header>
  );
}
