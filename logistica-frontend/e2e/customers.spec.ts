/**
 * E2E CRUD tests for the Customers module.
 *
 * - Default storageState = authenticated (testuser in `administrativo` group).
 * - `api` fixture seeds / cleans via the DRF API so each test is independent.
 * - Placeholder-based selectors throughout (FormControl renders <div>, not Slot).
 * - Email must be unique per seeded record (unique DB constraint).
 */

import { test, expect } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

const TS = Date.now().toString().slice(-8);
const cName = (label: string) => `E2E${TS}-CUST-${label}`;
const cEmail = (label: string) =>
  `e2e${TS}${label.toLowerCase().replace(/[^a-z0-9]/g, "")}@test.com`;

const BASE = (label: string) => ({
  name: cName(label),
  customer_type: "company",
  email: cEmail(label),
  city: "Lima",
  country: "PE",
  is_active: true,
});

// ── helpers ───────────────────────────────────────────────────────────────────

async function gotoList(page: Page) {
  await page.goto("/customers");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });
}

/** Type in the search box and wait for the debounced API response. */
async function search(page: Page, term: string) {
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes("/customers/") && r.status() === 200,
    { timeout: 8_000 }
  );
  await page.getByPlaceholder("Buscar por nombre, email, RUC…").fill(term);
  await responsePromise;
}

/**
 * Fill the customer form scoped to a container locator.
 * customer_type Select already defaults to "company" — not changed here.
 */
async function fillForm(
  container: Locator,
  name: string,
  email: string,
  overrides: { city?: string; country?: string } = {}
) {
  await container.getByPlaceholder("Nombre del cliente").fill(name);
  await container.getByPlaceholder("email@empresa.com").fill(email);
  await container.getByPlaceholder("Ciudad").fill(overrides.city ?? "Lima");
  await container.getByPlaceholder("País").fill(overrides.country ?? "PE");
}

// ── 1. List ───────────────────────────────────────────────────────────────────

test("list: seeded customer renders in the table", async ({ page, api }) => {
  const label = "list";
  const id = await api.seed("/customers/", BASE(label));

  try {
    await gotoList(page);
    await search(page, cName(label));
    await expect(page.getByText(cName(label))).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/customers", id);
  }
});

// ── 2. Create ─────────────────────────────────────────────────────────────────

test("create: valid form creates customer that appears in list", async ({
  page,
  api,
}) => {
  const label = "create";
  const name = cName(label);
  const email = cEmail(label);

  await gotoList(page);
  await page.getByRole("button", { name: "Nuevo cliente" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  await fillForm(dialog, name, email);
  await dialog.getByRole("button", { name: "Guardar" }).click();

  // Dialog closes on success
  await expect(dialog).not.toBeVisible({ timeout: 8_000 });

  // Customer appears in table
  await search(page, name);
  await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 });

  // Cleanup — resolve id via API search
  const res = await api.get(`/customers/?search=${encodeURIComponent(name)}`);
  const body = await res.json();
  if (body.results?.[0]) await api.remove("/customers", body.results[0].id);
});

// ── 3. Validation ─────────────────────────────────────────────────────────────

test("validation: empty name shows Zod error, dialog stays open", async ({
  page,
}) => {
  await gotoList(page);
  await page.getByRole("button", { name: "Nuevo cliente" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  // Fill a valid email to prevent browser-level type="email" block,
  // but leave name, city and country empty so Zod fires.
  await dialog.getByPlaceholder("email@empresa.com").fill("valid@e2etest.com");
  await dialog.getByRole("button", { name: "Guardar" }).click();

  // Name required error
  await expect(dialog.getByText("El nombre es requerido")).toBeVisible({
    timeout: 5_000,
  });
  // City required error
  await expect(dialog.getByText("La ciudad es requerida")).toBeVisible();

  // Dialog stays open — nothing was created
  await expect(dialog).toBeVisible();
});

// ── 4. Edit ───────────────────────────────────────────────────────────────────

test("edit: update customer name and verify on detail page", async ({
  page,
  api,
}) => {
  const original = cName("edit-orig");
  const updated = cName("edit-upd");
  const id = await api.seed("/customers/", {
    ...BASE("edit-orig"),
    name: original,
  });

  try {
    await gotoList(page);
    await search(page, original);

    // Click the edit row-action button
    const row = page.locator("tr").filter({ hasText: original });
    await row.getByRole("button", { name: "Editar cliente" }).click();

    // Navigates to /customers/:id
    await expect(page).toHaveURL(new RegExp(`/customers/${id}`), {
      timeout: 8_000,
    });

    // Enter edit mode
    await page.getByRole("button", { name: "Editar" }).click();

    // Replace name
    await page.getByPlaceholder("Nombre del cliente").fill(updated);

    await page.getByRole("button", { name: "Guardar" }).click();

    // Detail heading reflects update
    await expect(
      page.getByRole("heading", { name: updated, level: 1 })
    ).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/customers", id);
  }
});

// ── 5. Delete ─────────────────────────────────────────────────────────────────

test("delete: customer disappears from table after dialog confirmation", async ({
  page,
  api,
}) => {
  const label = "delete";
  const name = cName(label);
  const id = await api.seed("/customers/", BASE(label));

  await gotoList(page);
  await search(page, name);
  await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 });

  const row = page.locator("tr").filter({ hasText: name });
  await row.getByRole("button", { name: "Eliminar cliente" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await expect(dialog.getByText(name)).toBeVisible();

  await dialog.getByRole("button", { name: "Eliminar" }).click();

  // Row must vanish from tbody (dialog also contains the name briefly while
  // closing, so scope to tbody to avoid strict-mode violation)
  await expect(page.locator("tbody").getByText(name)).not.toBeVisible({
    timeout: 8_000,
  });

  // Best-effort fallback cleanup
  void api.remove("/customers", id).catch(() => {});
});

// ── 6. Search / filter ────────────────────────────────────────────────────────

test("search filter: typing narrows results to matching customer", async ({
  page,
  api,
}) => {
  const alpha = cName("srch-ALPHA");
  const beta = cName("srch-BETA");
  const gamma = cName("srch-GAMMA");

  const idA = await api.seed("/customers/", { ...BASE("srch-ALPHA"), name: alpha });
  const idB = await api.seed("/customers/", { ...BASE("srch-BETA"), name: beta });
  const idG = await api.seed("/customers/", { ...BASE("srch-GAMMA"), name: gamma });

  try {
    await gotoList(page);

    // Filter to ALPHA only
    await search(page, alpha);
    await expect(page.getByText(alpha)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(beta)).not.toBeVisible();
    await expect(page.getByText(gamma)).not.toBeVisible();

    // Broader prefix — all three appear
    const prefix = `E2E${TS}-CUST-srch`;
    await search(page, prefix);
    await expect(page.getByText(alpha)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(beta)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(gamma)).toBeVisible({ timeout: 5_000 });
  } finally {
    await Promise.all([
      api.remove("/customers", idA),
      api.remove("/customers", idB),
      api.remove("/customers", idG),
    ]);
  }
});
