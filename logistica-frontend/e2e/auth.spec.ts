/**
 * E2E tests for the authentication flow.
 *
 * The file-level test.use() clears storageState so every test starts
 * unauthenticated (mirrors the pattern in login.spec.ts).
 * Tests that need a logged-in session seed real tokens via API + page.evaluate.
 */

import { test, expect } from "@playwright/test";

// Clear the project-level storageState for every test in this file.
test.use({ storageState: { cookies: [], origins: [] } });

const API_BASE = process.env.E2E_API_BASE ?? "http://localhost:8000/api/v1";
const username = process.env.E2E_USERNAME ?? "admin";
const password = process.env.E2E_PASSWORD ?? "admin";

/** Obtain a real JWT pair and seed it into the page's localStorage. */
async function seedAuth(
  page: Parameters<Parameters<typeof test>[1]>[0],
  request: Parameters<Parameters<typeof test>[1]>[0]["request"]
) {
  const tokenRes = await request.post(`${API_BASE}/auth/token/`, {
    data: { username, password },
  });
  expect(tokenRes.ok(), `Token request failed: ${await tokenRes.text()}`).toBeTruthy();
  const { access, refresh } = await tokenRes.json();

  // Navigate to a page in the app origin first (required for localStorage to be scoped correctly)
  await page.goto("/login");
  await page.evaluate(
    ({ access, refresh }) => {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    },
    { access, refresh }
  );
  return { access, refresh };
}

// ── 1. Valid login ────────────────────────────────────────────────────────────

test("valid credentials redirect away from /login and show app layout", async ({
  page,
}) => {
  await page.goto("/login");
  // FormControl renders a <div id="X"> wrapper so getByLabel resolves to a
  // non-interactive div. Use placeholder/name selectors instead.
  await page.getByPlaceholder("nombre.usuario").fill(username);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  // Should leave /login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 12_000 });

  // Navigate to a protected page to verify the app shell renders
  await page.goto("/dashboard");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 8_000 });

  // Sidebar nav link visible
  await expect(
    page.getByRole("link", { name: "Dashboard" }).first()
  ).toBeVisible({ timeout: 8_000 });

  // Header avatar button visible
  await expect(
    page.getByRole("button", { name: "Menú de usuario" })
  ).toBeVisible();
});

// ── 2. Invalid login ──────────────────────────────────────────────────────────

test("invalid credentials show error and do not redirect", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("nombre.usuario").fill("usuario_invalido_xyz");
  await page.locator('input[type="password"]').fill("contraseña_invalida_xyz");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  // Error paragraph appears
  const errorParagraph = page.locator("p.text-destructive");
  await expect(errorParagraph).toBeVisible({ timeout: 10_000 });

  // Page stays on /login
  await expect(page).toHaveURL(/\/login/);
});

// ── 3. AuthGuard ──────────────────────────────────────────────────────────────

test("visiting a protected route without a token redirects to /login", async ({
  page,
}) => {
  await page.goto("/warehouses");
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
});

// ── 4. Logout ─────────────────────────────────────────────────────────────────

test("logout clears tokens and redirects to /login; protected routes then bounce", async ({
  page,
  request,
}) => {
  // Seed real tokens so the app considers the user authenticated
  await seedAuth(page, request);

  // Navigate to a protected page — auth guard must pass
  await page.goto("/dashboard");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

  // Open the user dropdown in the Header
  await page.getByRole("button", { name: "Menú de usuario" }).click();

  // Click "Cerrar sesión"
  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  // Should redirect to /login
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

  // Both tokens must be cleared
  const tokens = await page.evaluate(() => ({
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
  }));
  expect(tokens.access).toBeNull();
  expect(tokens.refresh).toBeNull();

  // A subsequent visit to a protected route also redirects
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
});

// ── 5. Token refresh (advanced) ───────────────────────────────────────────────

test("expired access token + valid refresh token is renewed transparently", async ({
  page,
  request,
}) => {
  // Obtain a real refresh token from the API
  const tokenRes = await request.post(`${API_BASE}/auth/token/`, {
    data: { username, password },
  });
  expect(tokenRes.ok(), `Token request failed: ${await tokenRes.text()}`).toBeTruthy();
  const { refresh } = await tokenRes.json();

  // Seed an invalid access token + real refresh token
  await page.goto("/login");
  await page.evaluate(
    ({ refresh }) => {
      localStorage.setItem("access_token", "invalid.access.token");
      localStorage.setItem("refresh_token", refresh);
    },
    { refresh }
  );

  // Navigate to a protected page. The 401 from the invalid access token must
  // trigger the axios interceptor to call /auth/token/refresh/ and retry.
  await page.goto("/warehouses");

  // The user must NOT be redirected to /login (refresh succeeded)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

  // Wait until the interceptor has stored the renewed access token
  await page.waitForFunction(
    () => {
      const t = localStorage.getItem("access_token");
      return t !== null && t !== "invalid.access.token";
    },
    { timeout: 15_000 }
  );

  const newAccessToken = await page.evaluate(() =>
    localStorage.getItem("access_token")
  );
  expect(newAccessToken).not.toBeNull();
  expect(newAccessToken).not.toBe("invalid.access.token");
});
