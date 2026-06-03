'use client';

import type { ElementType } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, User, Mail, Shield, Clock, Hash, Users } from 'lucide-react';

interface JwtPayload {
  exp?: number;
  iat?: number;
  token_type?: string;
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
  const { data: profile, isLoading } = useProfile();

  const payload = accessToken ? decodeJwt(accessToken) : null;

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username
    : '…';
  const username = profile?.username ?? '…';
  const email = profile?.email ?? '';
  const initials = (profile?.username ?? 'U').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="size-20 rounded-full bg-primary/15 border-4 border-card flex items-center justify-center text-2xl font-bold text-primary select-none">
              {initials}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold">{displayName}</h2>

              {/* Roles / badges */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile?.is_superuser && (
                  <Badge variant="destructive" className="text-xs">Superadmin</Badge>
                )}
                {profile?.groups.map((g) => (
                  <Badge key={g.id} variant="secondary" className="text-xs">{g.name}</Badge>
                ))}
                {!profile?.is_superuser && profile?.groups.length === 0 && (
                  <span className="text-xs text-muted-foreground">Sin roles asignados</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="text-sm font-semibold">Información de cuenta</h3>
        </div>
        <div className="divide-y divide-border/40">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36 ml-auto" />
              </div>
            ))
          ) : (
            <>
              <InfoRow icon={User} label="Usuario" value={username} />
              {email && <InfoRow icon={Mail} label="Email" value={email} />}
              {profile?.id !== undefined && (
                <InfoRow icon={Hash} label="ID de usuario" value={String(profile.id)} />
              )}
              {profile && profile.groups.length > 0 && (
                <InfoRow
                  icon={Users}
                  label="Roles"
                  value={profile.groups.map((g) => g.name).join(', ')}
                />
              )}
              {payload?.token_type && (
                <InfoRow icon={Shield} label="Tipo de token" value={payload.token_type} />
              )}
              {payload?.iat && (
                <InfoRow icon={Clock} label="Sesión iniciada" value={formatDate(payload.iat)} />
              )}
              {payload?.exp && (
                <InfoRow
                  icon={Clock}
                  label="Token expira"
                  value={`${formatDate(payload.exp)} (${timeUntilExpiry(payload.exp)})`}
                />
              )}
            </>
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
