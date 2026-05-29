# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server — http://localhost:3000 (run manually, never via AI)
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint check
```

> **IMPORTANT**: Dev servers start **manually by the user**. Never run `npm run dev` or `npm run start`.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| React | 19 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (PostCSS, `@tailwindcss` import) |
| Components | shadcn/ui (Radix primitives + Tailwind) |
| Tables | TanStack Table v8 (`useReactTable`, server-side pagination/sorting) |
| Server state | TanStack Query v5 (fetch, cache, invalidate — owns ALL API data) |
| Client state | Zustand (auth tokens, UI state only — never API data) |
| HTTP | Axios via `src/lib/api.ts` wrapper (interceptors for JWT + 401 refresh) |
| Forms | React Hook Form + zod (via shadcn Form component) |
| Linting | ESLint 9 (flat config, `eslint.config.mjs`) |

## Known Patterns & Gotchas

### zod v4 + @hookform/resolvers v5 — form schema rule
**NEVER** use `.default()` or `.optional()` in zod schemas used with `useForm`. These cause TIn ≠ TOut, breaking the resolver type chain across all RHF generics.

✅ Correct pattern:
```typescript
const schema = z.object({
  name: z.string().min(1),
  is_active: z.boolean(),   // no .default()
  capacity: z.string(),     // string, convert to number in handleSubmit
  latitude: z.string(),     // empty string, convert to null in handleSubmit
});
// Defaults go in useForm({ defaultValues: { is_active: true, capacity: '' } })
// Conversions (null, parseInt) go in handleSubmit body
```

### QueryClient singleton
`lib/queryClient.tsx` exports one singleton `queryClient`. `QueryProvider` must use that same instance — never create a second `new QueryClient()` inside `QueryProvider`.

---

## SDD Workflow — ALWAYS follow this

**One module at a time. Never skip phases.**

```
Spec → [Human Approval] → Implement → Validate → next module
```

**Entry point**: Invoke the `orchestrator` agent. It reads `docs/mvp.md` for module order and current status, then routes to the correct phase agent.

```
.claude/agents/
├── orchestrator.md   ← start here for any new module
├── spec.md           ← phase 1: produces docs/specs/{module}-spec.md
├── implement.md      ← phase 2: builds code, marks tasks [x]
└── validator.md      ← phase 3: audits code vs spec, reports failures
```

Module order (from `docs/mvp.md`): Auth → Suppliers → Warehouses → Customers → Products → Drivers → Transports → Routes → Shipments

---

## Architecture

**Next.js App Router** — file-based routing from `app/` directory.

- `app/layout.tsx` — root HTML shell, fonts, global metadata
- `app/page.tsx` — route `/`
- `app/globals.css` — Tailwind v4 import + CSS vars for theme

**Key conventions:**
- All components are **Server Components** by default. Add `'use client'` only when needed (event handlers, browser APIs, hooks).
- Path alias `@/*` maps to project root (e.g., `@/components/Button`).
- API routes go in `app/api/` as `route.ts` files.
- Fonts via `next/font/google` (self-hosted, no external requests at runtime).
- Images via `next/image` (optimization + lazy load).

## Tailwind v4 Notes

Tailwind v4 config is CSS-first — no `tailwind.config.js`. Theme customization goes in `globals.css` via CSS variables and `@theme`. PostCSS plugin: `@tailwindcss/postcss`.

---

## Backend — logistica-api

**Location**: `C:\Users\Henry\dev\codigo-vibecoding-g2\logistica-api`  
**Framework**: Django 6 + Django REST Framework + JWT auth  
**Base URL**: `http://localhost:8000/api/v1`  
**Swagger**: `GET /api/docs/`

### 8 Modules

| Module | Base Path | Notable |
|--------|-----------|---------|
| Suppliers | `/suppliers/` | Full CRUD + filters |
| Warehouses | `/warehouses/` | Full CRUD + `/stock/` custom action |
| Customers | `/customers/` | Full CRUD + `customer_type: company|individual` |
| Products | `/products/` | Full CRUD + FK to Supplier |
| Drivers | `/drivers/` | Full CRUD + nested `user_detail` (FK to auth.User) |
| Transports | `/transports/` | Full CRUD + `transport_type: truck|van|motorcycle|bicycle` + FK to Driver |
| Routes | `/routes/` | Full CRUD + nested `/stops/` sub-resource (CRUD) |
| Shipments | `/shipments/` | Full CRUD + nested `items[]` on create + `PATCH /status/` transition |

### Auth

```
POST /api/v1/auth/token/         → { access, refresh }
POST /api/v1/auth/token/refresh/ → { access }
Header: Authorization: Bearer <access_token>
```

### Global conventions (all modules)
- Pagination: 20/page, `?page=N` → `{ count, next, previous, results[] }`
- Filtering: `?field=value` (see per-module filters in `docs/api-reference.md`)
- Search: `?search=term`
- Ordering: `?ordering=field` or `?ordering=-field`

### Shipment status machine
```
pending → processing | cancelled
processing → in_transit | cancelled
in_transit → delivered | returned
delivered | cancelled | returned → (final)
```

### FK dependency tree
```
auth.User ← Driver ← Transport
Supplier ← Product ← ShipmentItem ← Shipment
Warehouse ← Route (origin) ← Shipment
Transport ← Route
Customer ← Shipment
```

### Full docs
- `docs/api-reference.md` — all endpoints, request/response shapes, query params
- `docs/data-models.md` — TypeScript interfaces for every model
- `docs/frontend-architecture.md` — SDD build order, folder structure, auth flow, UX constraints
- `docs/mvp.md` — module list, build order, status tracking, per-module scope
- `docs/specs/` — per-module spec files (created by spec agent, approved by human)
