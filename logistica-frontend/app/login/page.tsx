"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Ship, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const FEATURES = [
  "Gestión de envíos en tiempo real",
  "Control de flota y conductores",
  "Análisis de rendimiento logístico",
  "Seguimiento de rutas y almacenes",
];

// easeOut cubic-bezier — avoids Framer Motion string union type issue
const ease = [0, 0, 0.2, 1] as const;

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { login, isLoading, error } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  async function onSubmit(values: LoginFormValues) {
    await login(values);
    router.replace("/");
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col bg-primary relative overflow-hidden">
        {/* decorative circles */}
        <motion.div
          className="absolute -top-24 -left-24 size-96 rounded-full bg-white/5 pointer-events-none"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease }}
        />
        <motion.div
          className="absolute bottom-0 right-0 size-72 rounded-full bg-white/5 pointer-events-none"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease, delay: 0.2 }}
        />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.15 }}
          >
            <div className="flex items-center justify-center size-9 rounded-xl bg-primary-foreground/15">
              <Ship className="size-4 text-primary-foreground" />
            </div>
            <span className="text-primary-foreground font-bold text-lg tracking-tight">
              Logística
            </span>
          </motion.div>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.p
              className="text-primary-foreground/60 text-sm font-medium uppercase tracking-widest mb-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.25 }}
            >
              Sistema de gestión
            </motion.p>
            <motion.h1
              className="text-4xl xl:text-5xl font-bold text-primary-foreground leading-tight"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.32 }}
            >
              Controla tu<br />operación logística
            </motion.h1>
            <motion.p
              className="text-primary-foreground/70 mt-4 text-base max-w-sm leading-relaxed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.4 }}
            >
              Gestiona envíos, rutas y flota desde un único panel centralizado.
            </motion.p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {FEATURES.map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease, delay: 0.5 + i * 0.08 }}
                  className="flex items-center gap-3 text-primary-foreground/80 text-sm"
                >
                  <CheckCircle2 className="size-4 text-primary-foreground/50 shrink-0" />
                  {f}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <motion.p
            className="text-primary-foreground/40 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease, delay: 0.9 }}
          >
            © {new Date().getFullYear()} Logística. Todos los derechos reservados.
          </motion.p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <motion.div
        className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease, delay: 0.1 }}
      >
        {/* Mobile logo */}
        <motion.div
          className="lg:hidden flex flex-col items-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          <div className="flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground">
            <Ship className="size-6" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Logística</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema de gestión logística
            </p>
          </div>
        </motion.div>

        <div className="w-full max-w-sm">
          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Iniciar sesión</h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5 lg:rounded-none lg:border-0 lg:shadow-none lg:bg-transparent lg:p-0">
            {/* Mobile heading inside card */}
            <div className="lg:hidden">
              <h2 className="text-lg font-semibold">Iniciar sesión</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuario</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="nombre.usuario"
                          autoComplete="username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease }}
                    className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5"
                  >
                    <p className="text-sm text-destructive">{error}</p>
                  </motion.div>
                )}

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Iniciando sesión…
                      </>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
