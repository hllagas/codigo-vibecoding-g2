import { create } from "zustand";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@/lib/auth";
import type { TokenPair, AuthState } from "@/types/auth";

interface AuthActions {
  login: (pair: TokenPair) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

type AuthStore = AuthState & AuthActions;

function decodeIsSuperuser(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.is_superuser === true;
  } catch {
    return false;
  }
}

function hydrateFromStorage(): AuthState {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, isAuthenticated: false, is_superuser: false };
  }
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  return {
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken,
    is_superuser: accessToken ? decodeIsSuperuser(accessToken) : false,
  };
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...hydrateFromStorage(),

  login(pair: TokenPair) {
    setTokens(pair);
    set({
      accessToken: pair.access,
      refreshToken: pair.refresh,
      isAuthenticated: true,
      is_superuser: decodeIsSuperuser(pair.access),
    });
  },

  logout() {
    clearTokens();
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      is_superuser: false,
    });
  },

  setAccessToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
    set({ accessToken: token, is_superuser: decodeIsSuperuser(token) });
  },
}));
