'use client';

import type { ElementType } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield, Clock, Hash } from 'lucide-react';

interface JwtPayload {
  user_id?: number;
  username?: string;
  user?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  token_type?: string;
  jti?: string;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function timeUntilExpiry(exp: number): string {
  const remaining = exp * 1000 - Date.now();
  if (remaining <= 0) return 'Expirado';
  const minutes = Math.floor(remaining / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

export default function ProfilePage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { logout } = useAuth();

  const payload = accessToken ? decodeJwt(accessToken) : null;
  const username = payload?.username ?? payload?.user ?? payload?.sub ?? 'Usuario';
  const userId = payload?.user_id;
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        {/* Cover */}
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

        {/* Avatar + name */}
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="size-20 rounded-full bg-primary/15 border-4 border-card flex items-center justify-center text-2xl font-bold text-primary select-none">
              {initials}
            </div>
          </div>
          <h2 className="text-xl font-semibold">{username}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Operador logístico</p>
        </div>
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="text-sm font-semibold">Información de cuenta</h3>
        </div>
        <div className="divide-y divide-border/40">
          <InfoRow icon={User} label="Usuario" value={username} />
          {userId !== undefined && (
            <InfoRow icon={Hash} label="ID de usuario" value={String(userId)} />
          )}
          {payload?.token_type && (
            <InfoRow icon={Shield} label="Tipo de token" value={payload.token_type} />
          )}
          {payload?.iat && (
            <InfoRow
              icon={Clock}
              label="Sesión iniciada"
              value={formatDate(payload.iat)}
            />
          )}
          {payload?.exp && (
            <InfoRow
              icon={Clock}
              label="Token expira"
              value={`${formatDate(payload.exp)} (${timeUntilExpiry(payload.exp)})`}
            />
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/30 bg-card shadow-sm">
        <div className="px-6 py-4 border-b border-destructive/20">
          <h3 className="text-sm font-semibold text-destructive">Zona de peligro</h3>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Cerrar sesión</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cierra tu sesión actual y elimina los tokens almacenados.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={logout}>
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-3.5">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium truncate">{value}</span>
    </div>
  );
}
