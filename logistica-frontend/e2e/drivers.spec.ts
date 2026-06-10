/**
 * E2E CRUD tests for the Drivers module.
 *
 * - storageState = authenticated (testuser in `administrativo` group).
 * - `api` fixture seeds / cleans via the DRF API so each test is independent.
 *
 * CONSTRAINT: Driver.user is OneToOneField and user creation requires IsSuperUser
 * (testuser is not superuser). The only existing user without a driver profile is
 * leollasan (id=5). Tests run in SERIAL mode so each test can reuse leollasan:
 * seed a driver → do work → delete driver in finally. beforeEach cleans up any
 * leftover E2E test driver for that user so a failed previous test doesn't block.
 *
 * NOTE: DriverForm has NO transport Select. Transport references Drivers
 * (not vice versa). The form fields are: user (number input), license_number,
 * license_expiry (DatePicker), phone, is_available.
 * Search placeholder: "Buscar por licencia o teléfono…" — API: license_number | phone.
 */

import { test, expect } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const TS = Date.now().toString().slice(-8);

/** The only auth.User in the DB without a driver profile. */
const DRIVER_USER = {
  id: 5,
  username: "leollasan",
  first_name: "Leonardo",
  last_name: "Llagas",
  email: "leollasan@gmail.com",
  fullName: "Leonardo Llagas",
};

/** Unique license number per label within this run. */
const dLic = (label: string) =>
  `E2E${TS}${label.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8)}`;

/** Minimal driver payload for API seeding. */
function driverPayload(label: string) {
  return {
    user: DRIVER_USER.id,
    license_number: dLic(label),
    license_expiry: "2028-12-31",
    phone: `+51 9${TS}`,
    is_available: true,
  };
}

// ── cleanup ───────────────────────────────────────────────────────────────────

/** Remove any leftover E2E test driver for DRIVER_USER before each test. */
test.beforeEach(async ({ api }) => {
  try {
    // Drivers search by license_number | phone — "E2E" prefix matches only test data
    const res = await api.get("/drivers/?search=E2E");
    const body = await res.json();
    await Promise.all(
      (body.results ?? [])
        .filter((d: { user: number }) => d.user === DRIVER_USER.id)
        .map((d: { id: number }) => api.remove("/drivers", d.id))
    );
  } catch {
    // Non-fatal: cleanup is best-effort
  }
});

// ── page helpers ──────────────────────────────────────────────────────────────

async function gotoList(page: Page) {
  await page.goto("/drivers");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });
}

/** Type in search box and wait for the debounced API response. */
async function search(page: Page, term: string) {
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes("/drivers/") && r.status() === 200,
    { timeout: 8_000 }
  );
  await page.getByPlaceholder("Buscar por licencia o teléfono…").fill(term);
  await responsePromise;
}

/**
 * Click the DatePicker trigger (shows "Selecciona fecha") inside `container` and
 * pick day 20 from the calendar that opens in a Radix Popover portal.
 */
async function pickDate(container: Locator, page: Page) {
  await container.getByRole("button", { name: /Selecciona fecha/i }).click();
  const calPopover = page.locator("[data-radix-popper-content-wrapper]").last();
  await expect(calPopover).toBeVisible({ timeout: 3_000 });
  await calPopover.getByText("20", { exact: true }).click();
}

// ── 1. List ───────────────────────────────────────────────────────────────────

test("list: seeded driver renders in the table", async ({ page, api }) => {
  const driverId = await api.seed("/drivers/", driverPayload("list"));

  try {
    await gotoList(page);
    await search(page, dLic("list"));
    await expect(page.getByText(dLic("list"))).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/drivers", driverId);
  }
});

// ── 2. Create ─────────────────────────────────────────────────────────────────

test("create: fill user ID and date picker, driver appears in list", async ({
  page,
  api,
}) => {
  const lic = dLic("create");

  try {
    await gotoList(page);
    await page.getByRole("button", { name: "Nuevo conductor" }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // User ID — number input; fill() works with valid numeric strings
    await dialog.locator('input[name="user"]').fill(String(DRIVER_USER.id));
    await dialog.locator('input[name="license_number"]').fill(lic);
    // License expiry via DatePicker portal
    await pickDate(dialog, page);
    await dialog.locator('input[name="phone"]').fill("+51 999111222");

    await dialog.getByRole("button", { name: "Guardar" }).click();

    await expect(dialog).not.toBeVisible({ timeout: 8_000 });

    await search(page, lic);
    await expect(page.getByText(lic)).toBeVisible({ timeout: 8_000 });
  } finally {
    const res = await api.get(`/drivers/?search=${encodeURIComponent(lic)}`);
    const body = await res.json();
    if (body.results?.[0]) await api.remove("/drivers", body.results[0].id);
  }
});

// ── 3. Validation ─────────────────────────────────────────────────────────────

test("validation: empty form shows Zod errors, dialog stays open", async ({
  page,
}) => {
  await gotoList(page);
  await page.getByRole("button", { name: "Nuevo conductor" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  await dialog.getByRole("button", { name: "Guardar" }).click();

  await expect(dialog.getByText("El ID de usuario es requerido")).toBeVisible({
    timeout: 5_000,
  });
  await expect(dialog.getByText("El número de licencia es requerido")).toBeVisible();
  await expect(dialog).toBeVisible();
});

// ── 4. Detail — user-derived fields ──────────────────────────────────────────

test("detail: user-derived fields (full name, username, email) shown on detail page", async ({
  page,
  api,
}) => {
  const driverId = await api.seed("/drivers/", driverPayload("detail"));

  try {
    await page.goto(`/drivers/${driverId}`);
    await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });

    // h1 shows full name derived from user_detail.first_name + last_name
    await expect(
      page.getByRole("heading", { name: DRIVER_USER.fullName, level: 1 })
    ).toBeVisible({ timeout: 8_000 });

    // Detail fields — username and email from user_detail
    // Use exact: true because email also contains username as a substring
    await expect(page.getByText(DRIVER_USER.username, { exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(DRIVER_USER.email, { exact: true })).toBeVisible({ timeout: 5_000 });
  } finally {
    await api.remove("/drivers", driverId);
  }
});

// ── 5. Edit ───────────────────────────────────────────────────────────────────

test("edit: update phone and verify on detail page", async ({ page, api }) => {
  const driverId = await api.seed("/drivers/", driverPayload("edit"));
  const newPhone = `+51 8${TS}`;

  try {
    await gotoList(page);
    await search(page, dLic("edit"));

    const row = page.locator("tr").filter({ hasText: dLic("edit") });
    await row.getByRole("button", { name: "Editar conductor" }).click();

    await expect(page).toHaveURL(new RegExp(`/drivers/${driverId}`), {
      timeout: 8_000,
    });

    await page.getByRole("button", { name: "Editar" }).click();
    await expect(
      page.getByRole("heading", { name: "Editar conductor", level: 1 })
    ).toBeVisible({ timeout: 5_000 });

    await page.locator('input[name="phone"]').fill(newPhone);

    await page.getByRole("button", { name: "Guardar" }).click();

    // View mode restored — updated phone shown
    await expect(page.getByText(newPhone)).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/drivers", driverId);
  }
});

// ── 6. Delete ─────────────────────────────────────────────────────────────────

test("delete: driver disappears from table after dialog confirmation", async ({
  page,
  api,
}) => {
  const lic = dLic("delete");
  const driverId = await api.seed("/drivers/", driverPayload("delete"));

  try {
    await gotoList(page);
    await search(page, lic);
    await expect(page.getByText(lic)).toBeVisible({ timeout: 8_000 });

    const row = page.locator("tr").filter({ hasText: lic });
    await row.getByRole("button", { name: "Eliminar conductor" }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    // Delete dialog shows driver's full name
    await expect(
      dialog.locator("strong").filter({ hasText: DRIVER_USER.fullName })
    ).toBeVisible();

    await dialog.getByRole("button", { name: "Eliminar" }).click();

    // Scope to tbody to avoid strict-mode violation during dialog fade-out
    await expect(page.locator("tbody").getByText(lic)).not.toBeVisible({
      timeout: 8_000,
    });
  } finally {
    void api.remove("/drivers", driverId).catch(() => {});
  }
});

// ── 7. Search / filter ────────────────────────────────────────────────────────

test("search filter: license search shows matching driver and hides non-match", async ({
  page,
  api,
}) => {
  const lic = dLic("srch");
  const driverId = await api.seed("/drivers/", driverPayload("srch"));

  try {
    await gotoList(page);

    // Searching by exact license → driver visible
    await search(page, lic);
    await expect(page.getByText(lic)).toBeVisible({ timeout: 8_000 });

    // Searching by a non-matching string → driver NOT visible
    const noMatch = "XYZNO_MATCH_00000";
    await search(page, noMatch);
    await expect(page.getByText(lic)).not.toBeVisible({ timeout: 5_000 });

    // Partial prefix search → driver reappears
    await search(page, lic.slice(0, 10));
    await expect(page.getByText(lic)).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/drivers", driverId);
  }
});
