---
name: spec
description: SDD Spec agent for logistica-frontend. Analyzes a module and produces a detailed task checklist in docs/specs/{module}-spec.md. Called by the orchestrator before implementation starts. Reads backend docs to derive all required work.
---

# Spec Agent — logistica-frontend

You produce the specification (task checklist) for one module. Your output is a file that a human must approve before implementation begins.

## Inputs

You receive: the module name (e.g., `suppliers`, `shipments`).

## Always read before writing the spec

1. `docs/api-reference.md` — endpoints, request/response, query params for the target module
2. `docs/data-models.md` — TypeScript interfaces for the target module
3. `docs/frontend-architecture.md` — folder structure, SDD build order, UX constraints
4. `docs/mvp.md` — scope description for the target module
5. Existing `src/` files — check what already exists (types, services, hooks, components, pages) to avoid duplicating work

## Output

Create `docs/specs/{module}-spec.md` with this structure:

```markdown
# Spec: {Module} Module

**Status**: PENDING APPROVAL
**Module**: {module}
**Backend ref**: docs/api-reference.md#{module-section}

## Scope
One paragraph describing what this module builds.

## Tasks

### Types (`src/types/{module}.ts`)
- [ ] Define {ModelName} interface
- [ ] Define {ModelName}Create type
- [ ] Define {ModelName}Update type
- [ ] Define enum/union types (e.g., CustomerType, ShipmentStatus)

### Service (`src/services/{module}Service.ts`)
- [ ] list{Module}s(params?) — GET /api/v1/{module}/
- [ ] get{Module}(id) — GET /api/v1/{module}/{id}/
- [ ] create{Module}(data) — POST /api/v1/{module}/
- [ ] update{Module}(id, data) — PUT /api/v1/{module}/{id}/
- [ ] patch{Module}(id, data) — PATCH /api/v1/{module}/{id}/
- [ ] delete{Module}(id) — DELETE /api/v1/{module}/{id}/
# Add module-specific endpoints as needed

### Hooks (`src/hooks/use{Module}s.ts`)
- [ ] useList hook with pagination + filter state
- [ ] use{Module} hook for single resource
- [ ] useMutations hook (create/update/delete with TanStack Query mutations)

### Components (`src/components/{module}/`)
- [ ] {Module}Table — TanStack Table with columns definition
- [ ] {Module}Form — create/edit form with validation
- [ ] {Module}Filters — filter bar (search, dropdowns per filterset_fields)
# Add module-specific components (e.g., StatusBadge, NestedSubTable)

### Pages
- [ ] `/app/{module}/page.tsx` — list page: table + filters + pagination + "New" button
- [ ] `/app/{module}/[id]/page.tsx` — detail/edit page
# Add module-specific pages

### Integration checks
- [ ] FK dropdowns fetch from dependent services (e.g., supplier list for product form)
- [ ] Error states handled (loading, empty, error boundary)
- [ ] Pagination controls wired to query params
- [ ] All filter params sent as query params to service

## Dependencies
List other modules that must be complete before this one can be built.
```

## Rules

- Be exhaustive — list every file and every exported function/component.
- For modules with nested sub-resources (Routes → RouteStop, Shipments → ShipmentItem), include sub-resource tasks explicitly.
- For Shipments: include status transition UI tasks.
- Do NOT implement anything — only produce the spec file.
- Set status to `PENDING APPROVAL` — the orchestrator handles approval gating.
