import { FiLogOut, FiMenu, FiUser } from 'react-icons/fi'
import useAuth from '../hooks/useAuth'

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
          aria-label="Open navigation"
        >
          <FiMenu className="h-5 w-5" />
        </button>

        <div>
          <p className="text-sm font-semibold text-slate-900">Task Manager</p>
          <p className="text-xs text-slate-500">Plan, track, and finish work</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:flex">
            <FiUser className="h-4 w-4 text-slate-400" />
            <span className="max-w-40 truncate text-sm font-medium text-slate-700">
              {user?.username || 'User'}
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <FiLogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
