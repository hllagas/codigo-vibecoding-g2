import { createContext, useContext, useState } from 'react'
import { authService, type AuthUser } from '../services/authService'

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  login(email: string, password: string): Promise<void>
  register(name: string, lastname: string, email: string, password: string): Promise<void>
  logout(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getStoredToken(): string | null {
  return localStorage.getItem('token')
}

function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('user')
  return raw ? (JSON.parse(raw) as AuthUser) : null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)

  async function login(email: string, password: string) {
    const res = await authService.login(email, password)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    setToken(res.token)
    setUser(res.user)
  }

  async function register(name: string, lastname: string, email: string, password: string) {
    await authService.register(name, lastname, email, password)
    await login(email, password)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
