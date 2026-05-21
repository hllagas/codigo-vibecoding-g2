import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface FormErrors {
  name: string
  lastname: string
  email: string
  password: string
  confirmPassword: string
}

function validateName(value: string): string {
  if (!value.trim()) return 'Este campo es requerido'
  if (value.trim().length < 2) return 'Mínimo 2 caracteres'
  return ''
}

function validateEmail(value: string): string {
  if (!value) return 'El email es requerido'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un email válido'
  return ''
}

function validatePassword(value: string): string {
  if (!value) return 'La contraseña es requerida'
  if (value.length < 6) return 'Mínimo 6 caracteres'
  return ''
}

function validateConfirmPassword(value: string, password: string): string {
  if (!value) return 'Confirma tu contraseña'
  if (value !== password) return 'Las contraseñas no coinciden'
  return ''
}

const emptyErrors: FormErrors = { name: '', lastname: '', email: '', password: '', confirmPassword: '' }

export default function RegisterPage() {
  const navigate = useNavigate()
  const auth = useAuth()

  const [form, setForm] = useState({ name: '', lastname: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FormErrors>(emptyErrors)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function validateAll(): FormErrors {
    return {
      name: validateName(form.name),
      lastname: validateName(form.lastname),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.confirmPassword, form.password),
    }
  }

  function handleChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setForm((prev) => ({ ...prev, [field]: val }))
      if (touched[field]) {
        const next = { ...form, [field]: val }
        setErrors((prev) => ({
          ...prev,
          [field]:
            field === 'name' || field === 'lastname'
              ? validateName(val)
              : field === 'email'
                ? validateEmail(val)
                : field === 'password'
                  ? validatePassword(val)
                  : validateConfirmPassword(val, next.password),
          ...(field === 'password' && touched.confirmPassword
            ? { confirmPassword: validateConfirmPassword(next.confirmPassword, val) }
            : {}),
        }))
      }
    }
  }

  function handleBlur(field: keyof typeof form) {
    return () => {
      setTouched((prev) => ({ ...prev, [field]: true }))
      setErrors((prev) => ({
        ...prev,
        [field]:
          field === 'name' || field === 'lastname'
            ? validateName(form[field])
            : field === 'email'
              ? validateEmail(form.email)
              : field === 'password'
                ? validatePassword(form.password)
                : validateConfirmPassword(form.confirmPassword, form.password),
      }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const all = validateAll()
    setErrors(all)
    setTouched({ name: true, lastname: true, email: true, password: true, confirmPassword: true })
    if (Object.values(all).some(Boolean)) return

    setLoading(true)
    setServerError('')
    try {
      await auth.register(form.name.trim(), form.lastname.trim(), form.email, form.password)
      navigate('/')
    } catch (error) {
      setServerError((error as Error).message || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'w-full px-4 py-2.5 rounded-xl bg-white/10 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition'

  function fieldClass(error: string) {
    return `${inputBase} ${error ? 'border-red-400/70' : 'border-white/15 hover:border-white/25'}`
  }

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
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="text-slate-400 text-sm mt-1">Únete a Task Manager</p>
        </div>

        {serverError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-400/30 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Nombre y apellido en grid en pantallas medianas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                autoComplete="given-name"
                value={form.name}
                onChange={handleChange('name')}
                onBlur={handleBlur('name')}
                placeholder="Juan"
                className={fieldClass(errors.name)}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lastname" className="block text-sm font-medium text-slate-300 mb-1.5">
                Apellido
              </label>
              <input
                id="lastname"
                type="text"
                autoComplete="family-name"
                value={form.lastname}
                onChange={handleChange('lastname')}
                onBlur={handleBlur('lastname')}
                placeholder="Pérez"
                className={fieldClass(errors.lastname)}
              />
              {errors.lastname && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.lastname}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              placeholder="tu@email.com"
              className={fieldClass(errors.email)}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.email}
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
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                placeholder="Mínimo 6 caracteres"
                className={`${fieldClass(errors.password)} pr-11`}
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
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                placeholder="••••••••"
                className={`${fieldClass(errors.confirmPassword)} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.confirmPassword}
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
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
