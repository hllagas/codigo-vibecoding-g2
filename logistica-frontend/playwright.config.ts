/**
 * Prerequisites before running e2e tests:
 *   1. Backend (Django) running at http://localhost:8000
 *        cd logistica-api && python manage.py runserver
 *   2. Frontend (Next.js) running at http://localhost:3000
 *        cd logistica-frontend && npm run dev
 *   3. A test user exists in the Django DB:
 *        python manage.py createsuperuser
 *      or set E2E_USERNAME / E2E_PASSWORD env vars pointing to any existing user.
 *
 * webServer is intentionally NOT configured — servers start manually per project rules.
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
