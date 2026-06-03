"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Warehouse,
  Users,
  Package,
  Truck,
  Car,
  Route,
  Ship,
  X,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const navGroups = [
  {
    label: null,
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operaciones",
    links: [
      { href: "/shipments", label: "Envíos", icon: Ship },
      { href: "/routes", label: "Rutas", icon: Route },
      { href: "/transports", label: "Transportes", icon: Truck },
    ],
  },
  {
    label: "Recursos",
    links: [
      { href: "/drivers", label: "Conductores", icon: Car },
      { href: "/warehouses", label: "Almacenes", icon: Warehouse },
    ],
  },
  {
    label: "Catálogo",
    links: [
      { href: "/products", label: "Productos", icon: Package },
      { href: "/suppliers", label: "Proveedores", icon: Building2 },
      { href: "/customers", label: "Clientes", icon: Users },
    ],
  },
];

const adminGroup = {
  label: "Administración",
  links: [
    { href: "/users", label: "Usuarios", icon: ShieldCheck },
    { href: "/roles", label: "Roles", icon: Users },
  ],
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavContent({
  pathname,
  username,
  initials,
  isSuperUser,
  onClose,
  showClose,
}: {
  pathname: string;
  username: string | null;
  initials: string;
  isSuperUser: boolean;
  onClose: () => void;
  showClose?: boolean;
}) {
  return (
    <>
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Ship className="size-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-sidebar-foreground">
            Logística
          </span>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-sidebar-accent transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="size-4 text-sidebar-foreground" />
          </button>
        )}
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {[...navGroups, ...(isSuperUser ? [adminGroup] : [])].map((group) => (
          <div key={group.label ?? "_top"}>
            {group.label && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.links.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <motion.div
                    key={href}
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Link
                      href={href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-sidebar-accent transition-colors group"
        >
          <div className="size-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-semibold text-sidebar-primary shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground group-hover:text-sidebar-foreground transition-colors">
              {username ?? "Usuario"}
            </p>
            <p className="text-xs text-sidebar-foreground/50">Ver perfil</p>
          </div>
        </Link>
      </div>
    </>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isSuperUser = useAuthStore((state) => state.is_superuser);

  let username: string | null = null;
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      username = payload.username ?? payload.user ?? payload.sub ?? null;
    } catch {
      // ignore
    }
  }

  const initials = username ? username.slice(0, 2).toUpperCase() : "U";
  const navProps = { pathname, username, initials, isSuperUser, onClose };

  return (
    <>
      {/* ── Desktop sidebar — always visible, no animation ── */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <NavContent {...navProps} showClose={false} />
      </aside>

      {/* ── Mobile overlay + slide-in drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-20 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar border-r border-sidebar-border lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <NavContent {...navProps} showClose />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
