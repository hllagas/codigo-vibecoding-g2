/**
 * E2E CRUD tests for the Warehouses module.
 *
 * - Uses the default storageState (testuser, authenticated).
 * - Uses the `api` fixture for seeding / cleanup so each test is independent.
 * - Uses placeholder-based selectors because FormControl renders a <div>
 *   wrapper (not Slot), so getByLabel resolves to a non-interactive element.
 */

import { test, expect } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

// Unique run-level prefix so tests never collide with real or other-run data.
const TS = Date.now().toString().slice(-8);
const wh = (label: string) => `E2E${TS}-WH-${label}`;

const BASE = {
  address: "Av. E2E 100",
  city: "Lima",
  country: "PE",
  capacity: 500,
  is_active: true,
};

// ── helpers ───────────────────────────────────────────────────────────────────

/** Navigate to /warehouses and wait for the auth guard to pass. */
async function gotoList(page: Page) {
  await page.goto("/warehouses");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });
}

/**
 * Type into the search box and wait for the debounced API call to resolve.
 * Clears the box first if `term` is empty.
 */
async function search(page: Page, term: string) {
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes("/warehouses/") && r.status() === 200,
    { timeout: 8_000 }
  );
  await page.getByPlaceholder("Buscar por almacén o dirección…").fill(term);
  await responsePromise;
}

/** Fill the warehouse form fields (scoped to a container locator). */
async function fillForm(
  container: Locator,
  name: string,
  overrides: { address?: string; city?: string; country?: string; capacity?: string } = {}
) {
  await container.getByPlaceholder("Nombre de la bodega").fill(name);
  await container.getByPlaceholder("Dirección completa").fill(overrides.address ?? BASE.address);
  await container.getByPlaceholder("Ciudad").fill(overrides.city ?? BASE.city);
  await container.getByPlaceholder("País").fill(overrides.country ?? BASE.country);
  await container.getByPlaceholder("Ej: 1000").fill(overrides.capacity ?? String(BASE.capacity));
}

// ── 1. List ───────────────────────────────────────────────────────────────────

test("list: seeded warehouse renders in the table", async ({ page, api }) => {
  const name = wh("list");
  const id = await api.seed("/warehouses/", { name, ...BASE });

  try {
    await gotoList(page);
    await search(page, name);
    await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/warehouses", id);
  }
});

// ── 2. Create ─────────────────────────────────────────────────────────────────

test("create: valid form creates warehouse that appears in list", async ({ page, api }) => {
  const name = wh("create");

  await gotoList(page);
  await page.getByRole("button", { name: "Nuevo almacén" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  await fillForm(dialog, name);
  await dialog.getByRole("button", { name: "Guardar" }).click();

  // Dialog closes on success
  await expect(dialog).not.toBeVisible({ timeout: 8_000 });

  // Warehouse appears in list
  await search(page, name);
  await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 });

  // Cleanup — look up the created id via the API
  const res = await api.get(`/warehouses/?search=${encodeURIComponent(name)}`);
  const body = await res.json();
  if (body.results?.[0]) await api.remove("/warehouses", body.results[0].id);
});

// ── 3. Validation ─────────────────────────────────────────────────────────────

test("validation: submitting empty form shows Zod errors without creating", async ({
  page,
}) => {
  await gotoList(page);
  await page.getByRole("button", { name: "Nuevo almacén" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  // Submit empty form
  await dialog.getByRole("button", { name: "Guardar" }).click();

  // At least the name-required error must appear
  await expect(dialog.getByText("El nombre es requerido")).toBeVisible({
    timeout: 5_000,
  });

  // Capacity error also fires
  await expect(dialog.getByText("La capacidad es requerida")).toBeVisible();

  // Dialog remains open — nothing was created
  await expect(dialog).toBeVisible();
});

// ── 4. Edit ───────────────────────────────────────────────────────────────────

test("edit: update warehouse name and verify on detail page", async ({
  page,
  api,
}) => {
  const original = wh("edit-orig");
  const updated = wh("edit-upd");
  const id = await api.seed("/warehouses/", { name: original, ...BASE });

  try {
    await gotoList(page);
    await search(page, original);

    // Click the edit action button on the matching row
    const row = page.locator("tr").filter({ hasText: original });
    await row.getByRole("button", { name: "Editar almacén" }).click();

    // Navigates to /warehouses/:id
    await expect(page).toHaveURL(new RegExp(`/warehouses/${id}`), {
      timeout: 8_000,
    });

    // Enter edit mode
    await page.getByRole("button", { name: "Editar" }).click();

    // Replace name
    const nameInput = page.getByPlaceholder("Nombre de la bodega");
    await nameInput.fill(updated);

    await page.getByRole("button", { name: "Guardar" }).click();

    // Detail heading shows updated name after mutation
    await expect(
      page.getByRole("heading", { name: updated, level: 1 })
    ).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/warehouses", id);
  }
});

// ── 5. Delete ─────────────────────────────────────────────────────────────────

test("delete: warehouse disappears from list after dialog confirmation", async ({
  page,
  api,
}) => {
  const name = wh("delete");
  // Seed but keep the id only as a fallback — deletion happens via UI
  const id = await api.seed("/warehouses/", { name, ...BASE });

  await gotoList(page);
  await search(page, name);
  await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 });

  const row = page.locator("tr").filter({ hasText: name });
  await row.getByRole("button", { name: "Eliminar almacén" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await expect(dialog.getByText(name)).toBeVisible();

  // Confirm deletion
  await dialog.getByRole("button", { name: "Eliminar" }).click();

  // Row must vanish from the table body (dialog also contains the name
  // briefly while closing, so scope to tbody to avoid strict-mode violation)
  await expect(page.locator("tbody").getByText(name)).not.toBeVisible({ timeout: 8_000 });

  // Best-effort API cleanup in case UI delete failed silently
  void api.remove("/warehouses", id).catch(() => {});
});

// ── 6. Search / filter ────────────────────────────────────────────────────────

test("search filter: typing narrows results to matching warehouse", async ({
  page,
  api,
}) => {
  const alpha = wh("srch-ALPHA");
  const beta = wh("srch-BETA");
  const gamma = wh("srch-GAMMA");

  const idA = await api.seed("/warehouses/", { name: alpha, ...BASE });
  const idB = await api.seed("/warehouses/", { name: beta, ...BASE });
  const idG = await api.seed("/warehouses/", { name: gamma, ...BASE });

  try {
    await gotoList(page);

    // Filter to ALPHA only
    await search(page, alpha);
    await expect(page.getByText(alpha)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(beta)).not.toBeVisible();
    await expect(page.getByText(gamma)).not.toBeVisible();

    // Broader prefix — all three appear
    const prefix = `E2E${TS}-WH-srch`;
    await search(page, prefix);
    await expect(page.getByText(alpha)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(beta)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(gamma)).toBeVisible({ timeout: 5_000 });
  } finally {
    await Promise.all([
      api.remove("/warehouses", idA),
      api.remove("/warehouses", idB),
      api.remove("/warehouses", idG),
    ]);
  }
});
