import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { FiCheckSquare, FiGrid, FiX } from 'react-icons/fi'
import Navbar from '../components/Navbar'

const navItems = [
  { to: '/', label: 'Dashboard', icon: FiGrid },
  { to: '/tasks', label: 'Tasks', icon: FiCheckSquare },
]

const SidebarContent = ({ onNavigate }) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
          <FiCheckSquare className="h-5 w-5" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-bold text-slate-950">TaskFlow</p>
          <p className="text-xs text-slate-500">Workspace</p>
        </div>
      </div>

      <nav className="space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/30"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation overlay"
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Close navigation"
            >
              <FiX className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
