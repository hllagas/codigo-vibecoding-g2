import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, "../playwright/.auth/user.json");
const API_BASE = process.env.E2E_API_BASE ?? "http://localhost:8000/api/v1";

setup("authenticate via API and seed localStorage", async ({ page, request }) => {
  const username = process.env.E2E_USERNAME ?? "admin";
  const password = process.env.E2E_PASSWORD ?? "admin";

  // Obtain JWT tokens from DRF — avoids flaky UI login in setup
  const tokenRes = await request.post(`${API_BASE}/auth/token/`, {
    data: { username, password },
  });
  expect(
    tokenRes.ok(),
    `Auth token request failed (${tokenRes.status()}): ${await tokenRes.text()}`
  ).toBeTruthy();

  const { access, refresh } = await tokenRes.json();

  // Navigate to frontend origin so localStorage is scoped correctly
  await page.goto("/login");

  // Seed tokens — matches keys used by lib/auth.ts
  await page.evaluate(
    ({ access, refresh }) => {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    },
    { access, refresh }
  );

  // Verify auth guard passes before saving state
  await page.goto("/");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
