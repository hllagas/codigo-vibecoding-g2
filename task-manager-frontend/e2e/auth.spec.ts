import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import { TEST_CREDENTIALS } from './global-setup.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORAGE_STATE = path.join(__dirname, '../.auth/user.json')

test('login válido redirige a / y muestra header', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', TEST_CREDENTIALS.email)
  await page.fill('#password', TEST_CREDENTIALS.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
  await expect(page.locator('header')).toBeVisible()
})

test('login inválido muestra error y permanece en /login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'wrong@example.com')
  await page.fill('#password', 'wrongpassword')
  await page.click('button[type="submit"]')
  await expect(page.getByText('Invalid credentials')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

test('sin token en localStorage navegar a / redirige a /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/login')
})

test('logout limpia token y redirige; renavegar a / vuelve a /login', async ({ browser }) => {
  const context = await browser.newContext({ storageState: STORAGE_STATE })
  const page = await context.newPage()

  await page.goto('/')
  await expect(page).toHaveURL('/')

  await page.click('button[title="Cerrar sesión"]')
  await expect(page).toHaveURL('/login')

  const token = await page.evaluate(() => localStorage.getItem('token'))
  expect(token).toBeNull()

  await page.goto('/')
  await expect(page).toHaveURL('/login')

  await context.close()
})

test.skip('expiración de sesión con refresh token', async () => {
  // Not applicable: auth uses single UUID token stored in DB, no JWT access/refresh pair.
})
