import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKEND_URL = 'http://localhost:3001'
const STORAGE_STATE_PATH = path.join(__dirname, '../.auth/user.json')

export const TEST_CREDENTIALS = {
  name: 'Test',
  lastname: 'E2E',
  email: 'e2e-auth@playwright.local',
  password: 'E2eTest123!',
}

async function globalSetup() {
  // Register test user — ignore 409 (already exists)
  await fetch(`${BACKEND_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_CREDENTIALS),
  })

  const loginRes = await fetch(`${BACKEND_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
    }),
  })

  if (!loginRes.ok) {
    throw new Error(`globalSetup: login failed with status ${loginRes.status}`)
  }

  const { token, user } = (await loginRes.json()) as { token: string; user: object }

  await fs.mkdir(path.dirname(STORAGE_STATE_PATH), { recursive: true })
  await fs.writeFile(
    STORAGE_STATE_PATH,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:5173',
          localStorage: [
            { name: 'token', value: token },
            { name: 'user', value: JSON.stringify(user) },
          ],
        },
      ],
    }),
  )
}

export default globalSetup
