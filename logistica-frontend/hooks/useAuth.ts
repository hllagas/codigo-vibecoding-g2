"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import * as authService from "@/services/authService";
import type { LoginCredentials } from "@/types/auth";

export function useAuth() {
  const router = useRouter();
  const { isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(credentials: LoginCredentials): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      const tokenPair = await authService.login(credentials);
      storeLogin(tokenPair);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setError(
          axiosError.response?.data?.detail ??
            "Credenciales inválidas. Por favor, intente nuevamente."
        );
      } else {
        setError("Error de red. Por favor, verifique su conexión.");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function logout(): void {
    storeLogout();
    router.replace("/login");
  }

  return {
    isAuthenticated,
    login,
    logout,
    isLoading,
    error,
  };
}
