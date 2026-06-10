/**
 * E2E tests for the Shipments module (enhanced: items view + status transitions).
 *
 * - storageState = authenticated (testuser in `administrativo` group).
 * - `api` fixture seeds / cleans via the DRF API so each test is independent.
 * - seedDeps() seeds customer + warehouse + product (the required shipment FKs).
 * - ShipmentCreateForm: Radix Select triggers render custom <span> placeholder,
 *   select via getByRole("combobox").filter({ hasText: placeholder }).
 *   Options render in Radix portal → look up from page, not dialog.
 * - DatePicker: Radix Popover portal [data-radix-popper-content-wrapper], pick day 20.
 * - ShipmentItemsTable on detail page is READ-ONLY — items come from create form only.
 * - Status transitions (ShipmentStatusPanel): pending → "Procesar" (processing) / "Cancelar".
 *   After "Procesar" the badge shows "Procesando" and panel shows "Enviar" / "Cancelar".
 */

import { test, expect } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

const TS = Date.now().toString().slice(-8);
const sTrack = (label: string) =>
  `TRK${TS}${label.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;

// ── dependency seeding ────────────────────────────────────────────────────────

type ApiFixture = {
  get: (e: string) => ReturnType<import("@playwright/test").APIRequestContext["get"]>;
  seed: (e: string, p: Record<string, unknown>) => Promise<number | string>;
  remove: (e: string, id: number | string) => Promise<void>;
};

/** Seed customer + warehouse + product required for a shipment. */
async function seedDeps(api: ApiFixture, label: string) {
  const slug = label.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const custId = (await api.seed("/customers/", {
    name: `E2E${TS}-SC-${label}`,
    customer_type: "company",
    email: `e2e${TS}sc${slug}@test.com`,
    city: "Lima",
    country: "PE",
    is_active: true,
  })) as number;
  const whId = (await api.seed("/warehouses/", {
    name: `E2E${TS}-SW-${label}`,
    address: "Test 1",
    city: "Lima",
    country: "PE",
    capacity: 100,
    is_active: true,
  })) as number;
  const prodId = (await api.seed("/products/", {
    name: `E2E${TS}-SP-${label}`,
    sku: `SPSK${TS}${slug.slice(0, 4).toUpperCase()}`,
    category: "E2E-Cat",
    unit_price: "10.00",
    weight_kg: "1.000",
    supplier: null,
    is_active: true,
  })) as number;
  return {
    custId,
    whId,
    prodId,
    custName: `E2E${TS}-SC-${label}`,
    whName: `E2E${TS}-SW-${label}`,
    prodName: `E2E${TS}-SP-${label}`,
    async cleanup() {
      await api.remove("/products", prodId);
      await api.remove("/warehouses", whId);
      await api.remove("/customers", custId);
    },
  };
}

function shipmentPayload(
  tracking_number: string,
  custId: number,
  whId: number,
  prodId: number,
  opts?: { status?: string; qty?: number; price?: string }
) {
  return {
    tracking_number,
    customer: custId,
    origin_warehouse: whId,
    destination_address: "Av. Test 123",
    destination_city: "Lima",
    destination_country: "PE",
    status: opts?.status ?? "pending",
    scheduled_delivery_date: "2027-12-31",
    total_weight_kg: "5.00",
    items: [
      {
        product: prodId,
        quantity: opts?.qty ?? 1,
        unit_price_at_shipment: opts?.price ?? "10.00",
      },
    ],
  };
}

// ── page helpers ──────────────────────────────────────────────────────────────

async function gotoList(page: Page) {
  await page.goto("/shipments");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });
}

/** Fill search input and wait for the debounced API response. */
async function search(page: Page, term: string) {
  const resp = page.waitForResponse(
    (r) => r.url().includes("/shipments/") && r.status() === 200,
    { timeout: 8_000 }
  );
  await page.getByPlaceholder("Buscar por seguimiento, ciudad…").fill(term);
  await resp;
}

/**
 * Open a DatePicker (trigger shows "Selecciona fecha") and pick day 20.
 * Calendar renders in a Radix Popover portal.
 */
async function pickDate(page: Page, trigger: Locator) {
  await trigger.click();
  const calPopover = page.locator("[data-radix-popper-content-wrapper]").last();
  await expect(calPopover).toBeVisible({ timeout: 3_000 });
  await calPopover.getByText("20", { exact: true }).click();
}

// ── 1. List ───────────────────────────────────────────────────────────────────

test("list: seeded shipment renders in the table", async ({ page, api }) => {
  const dep = await seedDeps(api, "list");
  const tracking = sTrack("list");
  const id = await api.seed(
    "/shipments/",
    shipmentPayload(tracking, dep.custId, dep.whId, dep.prodId)
  );

  try {
    await gotoList(page);
    await search(page, tracking);
    await expect(page.getByText(tracking)).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/shipments", id);
    await dep.cleanup();
  }
});

// ── 2. Create — tracking_number visible on detail page ───────────────────────

test("create: form creates shipment; tracking_number shown as detail page heading", async ({
  page,
  api,
}) => {
  const dep = await seedDeps(api, "crt");
  const tracking = sTrack("create");

  try {
    await gotoList(page);
    await page.getByRole("button", { name: "Nuevo envío" }).click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    await dialog.locator('input[name="tracking_number"]').fill(tracking);

    // Customer select — options in Radix portal, look up from page
    await dialog.getByRole("combobox").filter({ hasText: "Selecciona cliente" }).click();
    await page.getByRole("option", { name: dep.custName }).click();

    // Warehouse select
    await dialog.getByRole("combobox").filter({ hasText: "Selecciona almacén" }).click();
    await page.getByRole("option", { name: dep.whName }).click();

    await dialog.locator('input[name="destination_address"]').fill("Av. E2E 123");
    await dialog.locator('input[name="destination_city"]').fill("Lima");
    await dialog.locator('input[name="destination_country"]').fill("PE");

    // Use name attr to avoid strict-mode clash with items.0.unit_price_at_shipment (same placeholder "0.00")
    await dialog.locator('input[name="total_weight_kg"]').fill("3.00");

    // Scheduled delivery date — first DatePicker trigger in the dialog
    const dateTrigger = dialog
      .getByRole("button", { name: /Selecciona fecha/i })
      .first();
    await pickDate(page, dateTrigger);

    // Items[0] product — after customer/warehouse selected, only "Selecciona" remains
    await dialog.getByRole("combobox").filter({ hasText: "Selecciona" }).click();
    await page.getByRole("option", { name: dep.prodName }).click();

    await dialog.locator('input[name="items.0.quantity"]').fill("2");
    await dialog.locator('input[name="items.0.unit_price_at_shipment"]').fill("9.99");

    await dialog.getByRole("button", { name: "Crear envío" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Verify in list, then navigate to detail and check h1 = tracking_number
    await search(page, tracking);
    await expect(page.getByText(tracking)).toBeVisible({ timeout: 8_000 });

    const row = page.locator("tr").filter({ hasText: tracking });
    await row.getByRole("button", { name: "Editar envío" }).click();

    await expect(
      page.getByRole("heading", { level: 1 }).filter({ hasText: tracking })
    ).toBeVisible({ timeout: 8_000 });
  } finally {
    const res = await api.get(`/shipments/?search=${encodeURIComponent(tracking)}`);
    const body = await res.json();
    if (body.results?.[0]) await api.remove("/shipments", body.results[0].id);
    await dep.cleanup();
  }
});

// ── 3. Validation ─────────────────────────────────────────────────────────────

test("validation: empty form shows Zod errors, dialog stays open", async ({
  page,
}) => {
  await gotoList(page);
  await page.getByRole("button", { name: "Nuevo envío" }).click();

  const dialog = page.locator('[role="dialog"]').first();
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  await dialog.getByRole("button", { name: "Crear envío" }).click();

  await expect(
    dialog.getByText("El número de seguimiento es requerido")
  ).toBeVisible({ timeout: 5_000 });

  await expect(dialog).toBeVisible();
});

// ── 4. Items visible on detail page ──────────────────────────────────────────

test("items: shipment items seeded via API appear in the detail page table", async ({
  page,
  api,
}) => {
  const dep = await seedDeps(api, "items");
  const tracking = sTrack("items");
  const ITEM_QTY = 3;
  const ITEM_PRICE = "15.50";

  const id = await api.seed(
    "/shipments/",
    shipmentPayload(tracking, dep.custId, dep.whId, dep.prodId, {
      qty: ITEM_QTY,
      price: ITEM_PRICE,
    })
  );

  try {
    await page.goto(`/shipments/${id}`);
    await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });

    // Wait for shipment data — h1 shows tracking_number
    await expect(
      page.getByRole("heading", { level: 1 }).filter({ hasText: tracking })
    ).toBeVisible({ timeout: 10_000 });

    // Items section heading
    await expect(
      page.getByRole("heading", { name: "Productos", level: 2 })
    ).toBeVisible();

    // Items table has a data row — quantity and formatted price are visible
    const itemsTable = page.locator("table").last();
    await expect(
      itemsTable.getByText(String(ITEM_QTY), { exact: true })
    ).toBeVisible({ timeout: 5_000 });
    await expect(itemsTable.getByText("15.50")).toBeVisible({ timeout: 5_000 });
  } finally {
    await api.remove("/shipments", id);
    await dep.cleanup();
  }
});

// ── 5. Status transition: pending → processing ────────────────────────────────

test("status-transition: Procesar button transitions pending to processing", async ({
  page,
  api,
}) => {
  const dep = await seedDeps(api, "trans");
  const tracking = sTrack("trans");
  const id = await api.seed(
    "/shipments/",
    shipmentPayload(tracking, dep.custId, dep.whId, dep.prodId, { status: "pending" })
  );

  try {
    await page.goto(`/shipments/${id}`);
    await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });

    // Wait for page load — current status is pending (two badges on page, use first())
    await expect(page.getByText("Pendiente").first()).toBeVisible({ timeout: 10_000 });

    // Transition to processing
    await page.getByRole("button", { name: "Procesar" }).click();

    // Badge updates to "Procesando" (two badges will appear, use first())
    await expect(page.getByText("Procesando").first()).toBeVisible({ timeout: 8_000 });

    // Panel now shows next valid transitions for processing state
    await expect(
      page.getByRole("button", { name: "Enviar" })
    ).toBeVisible({ timeout: 5_000 });
  } finally {
    await api.remove("/shipments", id);
    await dep.cleanup();
  }
});

// ── 6. Edit ───────────────────────────────────────────────────────────────────

test("edit: update destination city and verify on detail page", async ({
  page,
  api,
}) => {
  const dep = await seedDeps(api, "edit");
  const tracking = sTrack("edit");
  const id = await api.seed(
    "/shipments/",
    shipmentPayload(tracking, dep.custId, dep.whId, dep.prodId)
  );
  const newCity = `E2ECity${TS}`;

  try {
    await gotoList(page);
    await search(page, tracking);

    const row = page.locator("tr").filter({ hasText: tracking });
    await row.getByRole("button", { name: "Editar envío" }).click();

    await expect(page).toHaveURL(new RegExp(`/shipments/${id}`), {
      timeout: 8_000,
    });

    await page.getByRole("button", { name: "Editar" }).click();

    await expect(
      page.getByRole("heading", { name: "Editar envío", level: 1 })
    ).toBeVisible({ timeout: 5_000 });

    await page.locator('input[name="destination_city"]').fill(newCity);

    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText(newCity)).toBeVisible({ timeout: 8_000 });
  } finally {
    await api.remove("/shipments", id);
    await dep.cleanup();
  }
});

// ── 7. Delete ─────────────────────────────────────────────────────────────────

test("delete: shipment disappears from table after dialog confirmation", async ({
  page,
  api,
}) => {
  const dep = await seedDeps(api, "del");
  const tracking = sTrack("delete");
  const id = await api.seed(
    "/shipments/",
    shipmentPayload(tracking, dep.custId, dep.whId, dep.prodId)
  );

  try {
    await gotoList(page);
    await search(page, tracking);
    await expect(page.getByText(tracking)).toBeVisible({ timeout: 8_000 });

    const row = page.locator("tr").filter({ hasText: tracking });
    await row.getByRole("button", { name: "Eliminar envío" }).click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText(tracking)).toBeVisible();

    await dialog.getByRole("button", { name: "Eliminar" }).click();

    await expect(page.locator("tbody").getByText(tracking)).not.toBeVisible({
      timeout: 8_000,
    });
  } finally {
    void api.remove("/shipments", id).catch(() => {});
    await dep.cleanup();
  }
});

// ── 8. Search / filter ────────────────────────────────────────────────────────

test("search filter: typing narrows results to matching shipment", async ({
  page,
  api,
}) => {
  const dep = await seedDeps(api, "srch");

  const trkA = sTrack("srchALPHA");
  const trkB = sTrack("srchBETA");
  const trkC = sTrack("srchGAMMA");

  const idA = await api.seed(
    "/shipments/",
    shipmentPayload(trkA, dep.custId, dep.whId, dep.prodId)
  );
  const idB = await api.seed(
    "/shipments/",
    shipmentPayload(trkB, dep.custId, dep.whId, dep.prodId)
  );
  const idC = await api.seed(
    "/shipments/",
    shipmentPayload(trkC, dep.custId, dep.whId, dep.prodId)
  );

  try {
    await gotoList(page);

    // Filter to ALPHA only
    await search(page, trkA);
    await expect(page.getByText(trkA)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(trkB)).not.toBeVisible();
    await expect(page.getByText(trkC)).not.toBeVisible();

    // Broader prefix — all three appear (all start with TRK${TS}SRCH)
    const prefix = `TRK${TS}SRCH`;
    await search(page, prefix);
    await expect(page.getByText(trkA)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(trkB)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(trkC)).toBeVisible({ timeout: 5_000 });
  } finally {
    await Promise.all([
      api.remove("/shipments", idA),
      api.remove("/shipments", idB),
      api.remove("/shipments", idC),
    ]);
    await dep.cleanup();
  }
});
