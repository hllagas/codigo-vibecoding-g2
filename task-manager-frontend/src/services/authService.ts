const BASE_URL = '/api'

export interface AuthUser {
  id: string
  name: string
  lastname: string
  email: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const authService = {
  login(email: string, password: string): Promise<LoginResponse> {
    return fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse<LoginResponse>)
  },

  register(name: string, lastname: string, email: string, password: string): Promise<AuthUser> {
    return fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, lastname, email, password }),
    }).then(handleResponse<AuthUser>)
  },
}
