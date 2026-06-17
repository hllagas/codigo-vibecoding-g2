import axios from "axios";
import type { LoginCredentials, TokenPair, TokenRefreshResponse } from "@/types/auth";
import type { Profile } from "@/types/user";
import { apiGet, API_BASE_URL } from "@/lib/api";

/**
 * Login with username/password.
 * Uses plain axios (not the api instance) to avoid interceptor loops.
 */
export async function login(credentials: LoginCredentials): Promise<TokenPair> {
  const response = await axios.post<TokenPair>(`${API_BASE_URL}/auth/token/`, credentials);
  return response.data;
}

/**
 * Refresh the access token.
 * Uses plain axios (not the api instance) to avoid interceptor loops.
 */
export async function refreshToken(refresh: string): Promise<TokenRefreshResponse> {
  const response = await axios.post<TokenRefreshResponse>(`${API_BASE_URL}/auth/token/refresh/`, {
    refresh,
  });
  return response.data;
}

export function getProfile(): Promise<Profile> {
  return apiGet<Profile>('/auth/me/');
}
