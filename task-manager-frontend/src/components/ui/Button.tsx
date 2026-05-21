import type { ReactNode, ButtonHTMLAttributes } from 'react'
import Spinner from './Spinner'

type ButtonVariant = 'primary' | 'danger' | 'ghost' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
