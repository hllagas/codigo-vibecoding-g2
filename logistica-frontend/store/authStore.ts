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

function hydrateFromStorage(): AuthState {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, isAuthenticated: false };
  }
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  return {
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken,
  };
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Hydrate initial state from localStorage
  ...hydrateFromStorage(),

  login(pair: TokenPair) {
    setTokens(pair);
    set({
      accessToken: pair.access,
      refreshToken: pair.refresh,
      isAuthenticated: true,
    });
  },

  logout() {
    clearTokens();
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  setAccessToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
    set({ accessToken: token });
  },
}));
