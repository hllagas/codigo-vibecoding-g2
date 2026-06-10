import { test, expect } from "@playwright/test";

// Clear pre-seeded auth so these tests start unauthenticated
test.use({ storageState: { cookies: [], origins: [] } });

const username = process.env.E2E_USERNAME ?? "admin";
const password = process.env.E2E_PASSWORD ?? "admin";

test.describe("Login page", () => {
  test("valid credentials redirect away from /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("nombre.usuario").fill(username);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 12_000 });
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("nombre.usuario").fill("usuario_invalido");
    await page.locator('input[type="password"]').fill("contraseña_invalida_xyz");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    // Error renders inside a .text-destructive <p> below the form fields
    await expect(page.locator(".text-destructive")).toBeVisible({ timeout: 10_000 });
  });
});
