# Spec: Auth Module

**Status**: VALIDATED ✓  
**Module**: auth  
**Backend ref**: docs/api-reference.md#authentication

---

## Scope

Build the complete JWT authentication layer for the SPA. This includes: TypeScript types for token data, a token-storage helper (`src/lib/auth.ts`), an Axios instance with request/response interceptors (`src/lib/api.ts`), a Zustand store that owns auth state (`src/store/authStore.ts`), an `authService` for the two login/refresh API calls, a `useAuth` hook for consuming auth state, the Login page at `/login`, the authenticated app shell (sidebar + header), and a root-layout auth guard that redirects unauthenticated users. No CRUD modules are built here — two endpoints only.

---

## Tasks

### Types (`src/types/auth.ts`)
- [x] Define `TokenPair` interface: `{ access: string; refresh: string }`
- [x] Define `TokenRefreshResponse` interface: `{ access: string }`
- [x] Define `LoginCredentials` interface: `{ username: string; password: string }`
- [x] Define `AuthState` interface for Zustand store shape: `{ accessToken: string | null; refreshToken: string | null; isAuthenticated: boolean }`

---

### Token helpers (`src/lib/auth.ts`)
- [x] Export `getAccessToken(): string | null` — reads `access_token` from `localStorage`
- [x] Export `getRefreshToken(): string | null` — reads `refresh_token` from `localStorage`
- [x] Export `setTokens(pair: TokenPair): void` — persists both tokens to `localStorage`
- [x] Export `clearTokens(): void` — removes both keys from `localStorage`
- [x] All functions guard against SSR (`typeof window === 'undefined'` → return `null`/noop)

---

### Axios instance (`src/lib/api.ts`)
- [x] Create Axios instance with `baseURL` from `process.env.NEXT_PUBLIC_API_URL`
- [x] Request interceptor: attach `Authorization: Bearer <access_token>` header on every request (skip if no token)
- [x] Response interceptor — 401 handling:
  - [x] Read refresh token via `getRefreshToken()`
  - [x] If refresh token exists: POST `/auth/token/refresh/` with `{ refresh }`
  - [x] On refresh success: call `setTokens()` with new access + existing refresh, retry original request once
  - [x] On refresh failure (network error or 401 again): call `clearTokens()`, redirect to `/login`, reject promise
  - [x] If no refresh token at all: call `clearTokens()`, redirect to `/login`, reject promise
- [x] Export default Axios instance as `api`
- [x] Export typed helpers: `apiGet<T>`, `apiPost<T>`, `apiPut<T>`, `apiPatch<T>`, `apiDelete<T>` that wrap `api.get/post/put/patch/delete` and return `response.data`

---

### Auth store (`src/store/authStore.ts`)
- [x] Create Zustand store using `create<AuthStore>`
- [x] State: `accessToken: string | null`, `refreshToken: string | null`, `isAuthenticated: boolean`
- [x] Action `login(pair: TokenPair): void` — calls `setTokens(pair)`, updates state
- [x] Action `logout(): void` — calls `clearTokens()`, resets state to unauthenticated
- [x] Action `setAccessToken(token: string): void` — updates `accessToken` in state and localStorage (used after silent refresh)
- [x] Initialise state from `localStorage` on store creation (hydrate `accessToken`/`refreshToken` + derive `isAuthenticated`)
- [x] Export `useAuthStore` hook

---

### Auth service (`src/services/authService.ts`)
- [x] Export `login(credentials: LoginCredentials): Promise<TokenPair>` — POST `/auth/token/` (unauthenticated, uses plain `axios.post` not the `api` instance)
- [x] Export `refreshToken(refresh: string): Promise<TokenRefreshResponse>` — POST `/auth/token/refresh/` (unauthenticated, plain `axios.post`)

---

### Auth hook (`src/hooks/useAuth.ts`)
- [x] Export `useAuth()` hook that returns:
  - `isAuthenticated: boolean`
  - `login(credentials: LoginCredentials): Promise<void>` — calls `authService.login`, stores tokens via `authStore.login`, handles errors
  - `logout(): void` — calls `authStore.logout`, redirects to `/login`
  - `isLoading: boolean` — true while login request is in-flight
  - `error: string | null` — last login error message

---

### Login page (`src/app/login/page.tsx`)
- [x] Create `src/app/login/page.tsx` as a `'use client'` component
- [x] Render login form using **React Hook Form** + **zod** validation schema:
  - [x] `username` field: required, min-length 1
  - [x] `password` field: required, min-length 1
- [x] Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` primitives
- [x] Use shadcn `Input` and `Button` components
- [x] On submit: call `useAuth().login(credentials)`
- [x] Show inline error message if login fails (invalid credentials or network error)
- [x] Show loading state on submit button while request is in-flight (disabled + spinner or "Iniciando sesión…" label)
- [x] On success: redirect to `/` (root, which is the suppliers list once built)
- [x] Page layout: centered card, logo/app title at top, no sidebar/header
- [x] If already authenticated (token in store): redirect to `/` immediately (no login form flash)

---

### Authenticated app shell (`src/app/(app)/layout.tsx`)
- [x] Create route group `src/app/(app)/` for all authenticated pages
- [x] `layout.tsx` is a `'use client'` component (needs auth check)
- [x] Auth guard: on mount check `isAuthenticated`; if false → `router.replace('/login')`
- [x] While auth check is pending (initial hydration): render a full-page loading skeleton or spinner (no flash of protected content)
- [x] Render `<AppShell>` component wrapping `{children}` once authenticated

---

### AppShell component (`src/components/layout/AppShell.tsx`)
- [x] `'use client'` component
- [x] Renders `<Sidebar>` + `<Header>` + `<main>` content area
- [x] Sidebar collapses on mobile (toggle via state)
- [x] Pass `children` into `<main>` with proper padding/scroll

---

### Sidebar component (`src/components/layout/Sidebar.tsx`)
- [x] `'use client'` component
- [x] Navigation links (use `lucide-react` icons):
  - [x] Suppliers — `/suppliers`
  - [x] Warehouses — `/warehouses`
  - [x] Customers — `/customers`
  - [x] Products — `/products`
  - [x] Drivers — `/drivers`
  - [x] Transports — `/transports`
  - [x] Routes — `/routes`
  - [x] Shipments — `/shipments`
- [x] Active link highlighted using Next.js `usePathname()`
- [x] Logout button at bottom: calls `useAuth().logout()`
- [x] Show app name/logo at top of sidebar

---

### Header component (`src/components/layout/Header.tsx`)
- [x] `'use client'` component
- [x] Show current page title (derived from `usePathname()` or passed as prop)
- [x] Show logged-in username from auth store (optional: read from decoded JWT or store)
- [x] Mobile: hamburger button to toggle sidebar

---

### Root layout update (`src/app/layout.tsx`)
- [x] Replace existing boilerplate `layout.tsx` with production version:
  - [x] Keep `<html>` and `<body>` wrapper
  - [x] Remove Next.js default boilerplate metadata
  - [x] Set app metadata: `title: "Logística"`, `description: "Sistema de gestión logística"`
  - [x] Keep Geist fonts or switch to system font stack
  - [x] Wrap `{children}` in a **TanStack Query** `<QueryClientProvider>` (`src/lib/queryClient.ts`)

---

### TanStack Query client (`src/lib/queryClient.ts`)
- [x] Create and export `queryClient` instance with sensible defaults:
  - `staleTime: 1000 * 60` (1 minute)
  - `retry: 1`
- [x] Create and export `QueryClientProvider` wrapper component (`QueryProvider`) for use in root layout

---

### Home page redirect (`src/app/page.tsx`)
- [x] Replace existing boilerplate `page.tsx` with a redirect: if authenticated → `/suppliers`, else → `/login`
- [x] Implement as a simple client component that reads auth state and calls `router.replace()`

---

### Integration checks
- [x] `NEXT_PUBLIC_API_URL` is read from environment — document required value in `.env.local.example`
- [x] Login form shows field-level validation errors before submit (zod schema enforced by React Hook Form)
- [x] 401 interceptor does NOT retry indefinitely — exactly one refresh attempt then logout
- [x] No protected page content is rendered before auth check completes (prevents flash)
- [x] `localStorage` access is SSR-safe throughout (guarded by `typeof window !== 'undefined'`)
- [x] Logout clears all tokens and navigates to `/login`

---

## Dependencies

None — Auth is module 0. All other modules depend on Auth being complete.

## Validation Report

**Result**: PASS

All files exist and compile with zero TypeScript errors.

**File checklist**:
- ✓ `components/ui/form.tsx` — exports Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
- ✓ `app/login/page.tsx` — uses 'use client', Form + FormField + FormItem + FormLabel + FormControl + FormMessage from shadcn, React Hook Form + zod schema (username, password required), Input and Button components, loading state with spinner, error display, authenticated redirect
- ✓ All 14 supporting files present and structured correctly:
  - `types/auth.ts`, `lib/auth.ts`, `lib/api.ts`, `lib/queryClient.tsx`
  - `store/authStore.ts`, `services/authService.ts`, `hooks/useAuth.ts`
  - `app/(app)/layout.tsx`, `components/layout/AppShell.tsx`, `Sidebar.tsx`, `Header.tsx`
  - `app/layout.tsx`, `app/page.tsx`, `.env.local.example`

**TypeScript**: Zero errors via `tsc --noEmit`

**Status**: Ready for integration testing with backend API.
