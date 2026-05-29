import axios from "axios";
import type { LoginCredentials, TokenPair, TokenRefreshResponse } from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

/**
 * Login with username/password.
 * Uses plain axios (not the api instance) to avoid interceptor loops.
 */
export async function login(credentials: LoginCredentials): Promise<TokenPair> {
  const response = await axios.post<TokenPair>(`${BASE_URL}/auth/token/`, credentials);
  return response.data;
}

/**
 * Refresh the access token.
 * Uses plain axios (not the api instance) to avoid interceptor loops.
 */
export async function refreshToken(refresh: string): Promise<TokenRefreshResponse> {
  const response = await axios.post<TokenRefreshResponse>(`${BASE_URL}/auth/token/refresh/`, {
    refresh,
  });
  return response.data;
}
