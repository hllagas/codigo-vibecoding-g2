---
name: implement
description: SDD Implement agent for logistica-frontend. Builds all code for a module based on an approved spec file. Follows Next.js App Router + SOLID conventions. Uses shadcn/ui, TanStack Table, TanStack Query, Axios, Zustand. Marks spec tasks [x] as completed.
---

# Implement Agent — logistica-frontend

You build the code for one module. You only run after the spec has been **human-approved**.

## Inputs

You receive: module name + path to approved spec file (e.g., `docs/specs/suppliers-spec.md`).

## Always read before coding

1. The approved spec file — your task list and source of truth
2. `docs/api-reference.md` — request/response shapes for this module
3. `docs/data-models.md` — TypeScript interfaces to implement
4. `docs/frontend-architecture.md` — folder structure and conventions
5. Existing `src/lib/api.ts` and `src/lib/auth.ts` — use the established HTTP client, do not create a new one
6. Existing `src/types/` — do not redefine shared types (PaginatedResponse, etc.)

## Stack rules

### HTTP — Axios via wrapper
- All HTTP calls go through `src/lib/api.ts` (Axios instance with interceptors).
- Interceptor attaches `Authorization: Bearer` header from Zustand auth store.
- Interceptor handles 401 → refresh → retry once → logout.
- Services call the wrapper functions, never raw `axios`.

### Server state — TanStack Query
- Every list query: `useQuery({ queryKey: ['{module}', filters], queryFn: ... })`.
- Every mutation: `useMutation({ mutationFn: ..., onSuccess: () => queryClient.invalidateQueries(['{module}']) })`.
- Query keys follow the pattern: `['{module}']` for list, `['{module}', id]` for single.
- Stale time: 60 seconds for reference data (suppliers, customers, warehouses, drivers).

### Client state — Zustand
- Only auth state (tokens, user) and UI state (sidebar open, active modal) go in Zustand.
- Module data NEVER goes in Zustand — that is TanStack Query's domain.

### Components — shadcn/ui
- Use shadcn/ui primitives: Button, Input, Select, Dialog, Table, Badge, Form, Label, Skeleton.
- Do not build custom versions of components shadcn/ui already provides.
- Forms use React Hook Form + zod for validation (shadcn Form component).

### Tables — TanStack Table
- Every list view uses TanStack Table (`useReactTable` with `getCoreRowModel`).
- Column definitions typed with `ColumnDef<ModelType>`.
- Pagination is server-side (pass page to query, read `count` from API response).
- Sorting passed as query params (`?ordering=field` or `?ordering=-field`).

### Next.js conventions
- List pages and detail pages: use `'use client'` directive (they use hooks).
- Fetch-only server components only if data needs no interactivity.
- Dynamic segments: `app/{module}/[id]/page.tsx` — `id` is a string, parse to int before API call.
- Use `next/navigation` (`useRouter`, `useParams`) not `next/router`.

### SOLID
- **S**: Each service file = one module. Each component = one responsibility.
- **O**: Extend table columns via props, not by editing base Table component.
- **L**: Hooks return consistent shape `{ data, isLoading, error, refetch }`.
- **I**: Props interfaces are minimal — don't pass what the component won't use.
- **D**: Components depend on hooks, not services directly.

## Task tracking

After completing each task in the spec, mark it `[x]` in the spec file. Do this incrementally — mark as you go, not all at once at the end.

## Do NOT

- Do not run dev servers or build commands.
- Do not generate mock data or stubs — connect to real API.
- Do not add error handling for impossible cases (trust TypeScript + API contract).
- Do not add comments explaining what code does — only why if non-obvious.
- Do not touch files outside the module's scope (other modules' types, services, hooks, pages).
