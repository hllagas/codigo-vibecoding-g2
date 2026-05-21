import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function validateEmail(value: string): string {
  if (!value) return 'El email es requerido'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un email válido'
  return ''
}

export default function LoginPage() {
  const navigate = useNavigate()
  const auth = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setEmail(val)
    if (touched.email) setEmailError(validateEmail(val))
  }

  function handleEmailBlur() {
    setTouched((prev) => ({ ...prev, email: true }))
    setEmailError(validateEmail(email))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateEmail(email)
    setEmailError(err)
    setTouched({ email: true, password: true })
    if (err || !password) return

    setLoading(true)
    setServerError('')
    try {
      await auth.login(email, password)
      navigate('/')
    } catch (error) {
      setServerError((error as Error).message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const passwordError = touched.password && !password ? 'La contraseña es requerida' : ''

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-4 py-8 sm:px-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="animate-fade-in-up relative w-full sm:max-w-md sm:rounded-2xl sm:shadow-2xl sm:border sm:border-white/10 bg-white/5 sm:bg-white/10 backdrop-blur-xl p-8 sm:p-10 min-h-screen sm:min-h-0 flex flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 mb-4">
            <CheckSquare className="w-6 h-6 text-indigo-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
          <p className="text-slate-400 text-sm mt-1">Inicia sesión en Task Manager</p>
        </div>

        {serverError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-400/30 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="tu@email.com"
              className={`w-full px-4 py-2.5 rounded-xl bg-white/10 border text-white placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
                ${emailError ? 'border-red-400/70' : 'border-white/15 hover:border-white/25'}`}
            />
            {emailError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (touched.password) setTouched((prev) => ({ ...prev, password: true }))
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 pr-11 rounded-xl bg-white/10 border text-white placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
                  ${passwordError ? 'border-red-400/70' : 'border-white/15 hover:border-white/25'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-white
              bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent
              transition-colors duration-150 mt-2"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
