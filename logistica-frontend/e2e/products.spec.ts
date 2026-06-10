/**
 * E2E CRUD tests for the Products module (enhanced — supplier select + SKU uniqueness).
 *
 * - storageState = authenticated (testuser in `administrativo` group).
 * - `api` fixture seeds / cleans via the DRF API so each test is independent.
 * - A shared supplier is seeded in beforeAll and cleaned in afterAll; tests
 *   that exercise the supplier Select use it (ProductForm has no warehouse select).
 * - ProductForm has no placeholder on name/sku/category inputs — use RHF
 *   name attributes (input[name="..."]) instead.
 * - Duplicate SKU error comes from the backend and is shown via toast.error.
 */

import { test, expect } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

const TS = Date.now().toString().slice(-8);
const pName = (label: string) => `E2E${TS}-PROD-${label}`;
const pSku = (label: string) =>
  `SKU${TS}${label.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`;

const SUPP_NAME = `E2E${TS}-SUPP`;
let supplierId: number;

const BASE = (label: string) => ({
  name: pName(label),
  sku: pSku(label),
  category: "E2E-Cat",
  unit_price: "10.00",
  weight_kg: "1.000",
  supplier: null,
  description: null,
  is_active: true,
});

// ── shared supplier ───────────────────────────────────────────────────────────

test.beforeAll(async ({ api }) => {
  supplierId = (await api.seed("/suppliers/", {
    name: SUPP_NAME,
    email: `e2e${TS}supp@test.com`,
    city: "Lima",
    country: "PE",
    is_active: true,
  })) as number;
});

test.afterAll(async ({ api }) => {
  if (supplierId) await api.remove("/suppliers", supplierId);
});

// ── helpers ───────────────────────────────────────────────────────────────────

async function gotoList(page: Page) {
  await page.goto("/products");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });
}

/** Type in search box and wait for debounced API response. */
async function search(page: Page, term: string) {
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes("/products/") && r.status() === 200,
    { timeout: 8_000 }
  );
  await page.getByPlaceholder("Buscar por nombre o SKU…").fill(term);
  await responsePromise;
}

/**
 * Fill required product form fields scoped to a container.
 * name/sku/category have no placeholder — use RHF name attrs.
 * unit_price and weight_kg also use name attrs to avoid ambiguous placeholder match.
 */
async function fillForm(
  container: Locator,
  name: string,
  sku: string,
  overrides: { category?: string; unit_price?: string; weight_kg?: string } = {}
) {
  await container.locator('input[name="name"]').fill(name);
  await container.locator('input[name="sku"]').fill(sku);
  await container.locator('input[name="category"]').fill(overrides.category ?? "E2E-Cat");
  await container.locator('input[name="unit_price"]').fill(overrides.unit_price ?? "10.00");
  await container.locator('input[name="weight_kg"]').fill(overrides.weight_kg ?? "1.000");
}

/**
 * Click the supplier Select trigger (shows "Sin proveedor" on empty form)
 * and pick the given supplier by name.
 * Options render in a Radix portal outside the dialog, so pass `page` for option lookup.
 */
async function selectSupplier(page: Page, container: Locator, supplierName: string) {
  await container.getByRole("combobox").filter({ hasText: "Sin proveedor" }).click();
  await page.getByRole("option", { name: supplierName }).click();
}

// ── 1. List ───────────────────────────────────────────────────────────────────

test("list: seeded product renders in the table", async ({ page, api }) => {
  const id = await api.seed("/products/", BASE("list"));

  try {
    await gotoList(page);
    await search(page, pName("list"));
    await expect(page.getByText(pName("list"))).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/products", id);
  }
});

// ── 2. Create ─────────────────────────────────────────────────────────────────

test("create: select supplier from dropdown and create product that appears in list", async ({
  page,
  api,
}) => {
  const name = pName("create");
  const sku = pSku("create");

  await gotoList(page);
  await page.getByRole("button", { name: "Nuevo producto" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  await fillForm(dialog, name, sku);

  // Verify supplier select is populated with seeded supplier and select it
  await selectSupplier(page, dialog, SUPP_NAME);
  await expect(
    dialog.getByRole("combobox").filter({ hasText: SUPP_NAME })
  ).toBeVisible({ timeout: 3_000 });

  await dialog.getByRole("button", { name: "Guardar" }).click();

  await expect(dialog).not.toBeVisible({ timeout: 8_000 });

  await search(page, name);
  await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 });

  // Cleanup — resolve id via API search
  const res = await api.get(`/products/?search=${encodeURIComponent(name)}`);
  const body = await res.json();
  if (body.results?.[0]) await api.remove("/products", body.results[0].id);
});

// ── 3. Validation ─────────────────────────────────────────────────────────────

test("validation: empty form shows Zod errors, dialog stays open", async ({
  page,
}) => {
  await gotoList(page);
  await page.getByRole("button", { name: "Nuevo producto" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  await dialog.getByRole("button", { name: "Guardar" }).click();

  await expect(dialog.getByText("El nombre es requerido")).toBeVisible({
    timeout: 5_000,
  });
  await expect(dialog.getByText("El SKU es requerido")).toBeVisible();
  await expect(dialog).toBeVisible();
});

// ── 4. Edit ───────────────────────────────────────────────────────────────────

test("edit: select supplier and update name, verify on detail page", async ({
  page,
  api,
}) => {
  const original = pName("edit-orig");
  const updated = pName("edit-upd");
  const id = await api.seed("/products/", { ...BASE("edit-orig"), name: original });

  try {
    await gotoList(page);
    await search(page, original);

    const row = page.locator("tr").filter({ hasText: original });
    await row.getByRole("button", { name: "Editar producto" }).click();

    await expect(page).toHaveURL(new RegExp(`/products/${id}`), {
      timeout: 8_000,
    });

    await page.getByRole("button", { name: "Editar" }).click();
    await expect(
      page.getByRole("heading", { name: "Editar producto", level: 1 })
    ).toBeVisible({ timeout: 5_000 });

    // Select supplier (verifies select is populated on edit form too)
    await page.getByRole("combobox").filter({ hasText: "Sin proveedor" }).click();
    await page.getByRole("option", { name: SUPP_NAME }).click();
    await expect(
      page.getByRole("combobox").filter({ hasText: SUPP_NAME })
    ).toBeVisible({ timeout: 3_000 });

    // Also update name
    await page.locator('input[name="name"]').fill(updated);

    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(
      page.getByRole("heading", { name: updated, level: 1 })
    ).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/products", id);
  }
});

// ── 5. Delete ─────────────────────────────────────────────────────────────────

test("delete: product disappears from table after dialog confirmation", async ({
  page,
  api,
}) => {
  const name = pName("delete");
  const id = await api.seed("/products/", BASE("delete"));

  await gotoList(page);
  await search(page, name);
  await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 });

  const row = page.locator("tr").filter({ hasText: name });
  await row.getByRole("button", { name: "Eliminar producto" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await expect(dialog.locator("strong").filter({ hasText: name })).toBeVisible();

  await dialog.getByRole("button", { name: "Eliminar" }).click();

  // Scope to tbody to avoid strict-mode violation while dialog fades out
  await expect(page.locator("tbody").getByText(name)).not.toBeVisible({
    timeout: 8_000,
  });

  void api.remove("/products", id).catch(() => {});
});

// ── 6. Search / filter ────────────────────────────────────────────────────────

test("search filter: typing narrows results to matching product", async ({
  page,
  api,
}) => {
  const alpha = pName("srch-ALPHA");
  const beta = pName("srch-BETA");
  const gamma = pName("srch-GAMMA");

  const idA = await api.seed("/products/", { ...BASE("srch-ALPHA"), name: alpha });
  const idB = await api.seed("/products/", { ...BASE("srch-BETA"), name: beta });
  const idG = await api.seed("/products/", { ...BASE("srch-GAMMA"), name: gamma });

  try {
    await gotoList(page);

    await search(page, alpha);
    await expect(page.getByText(alpha)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(beta)).not.toBeVisible();
    await expect(page.getByText(gamma)).not.toBeVisible();

    const prefix = `E2E${TS}-PROD-srch`;
    await search(page, prefix);
    await expect(page.getByText(alpha)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(beta)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(gamma)).toBeVisible({ timeout: 5_000 });
  } finally {
    await Promise.all([
      api.remove("/products", idA),
      api.remove("/products", idB),
      api.remove("/products", idG),
    ]);
  }
});

// ── 7. Duplicate SKU ──────────────────────────────────────────────────────────

test("duplicate-sku: backend error shown as toast when SKU already exists", async ({
  page,
  api,
}) => {
  const sku = pSku("dupsku");
  const firstId = await api.seed("/products/", { ...BASE("dup-first"), sku });

  try {
    await gotoList(page);
    await page.getByRole("button", { name: "Nuevo producto" }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Fill form with the same SKU that already exists in the DB
    await fillForm(dialog, pName("dup-second"), sku);

    await dialog.getByRole("button", { name: "Guardar" }).click();

    // Backend rejects duplicate SKU → toast.error fires
    await expect(
      page.locator('[data-sonner-toast][data-type="error"]')
    ).toBeVisible({ timeout: 8_000 });

    // Dialog stays open (catch block does not call setIsCreateOpen(false))
    await expect(dialog).toBeVisible();
  } finally {
    await api.remove("/products", firstId);
  }
});
