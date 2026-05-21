import { Link, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-slate-900 hover:text-indigo-600 transition-colors"
        >
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          Task Manager
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">
              {user.name} {user.lastname}
            </span>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
