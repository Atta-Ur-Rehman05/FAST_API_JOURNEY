import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ImagePlus, FolderTree, Package, Users, ShoppingCart, Image, FileText, Layers, LogOut } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Home Slides', path: '/admin/slides', icon: ImagePlus, hasDropdown: true },
    { label: 'Category', path: '/admin/categories', icon: FolderTree, hasDropdown: true },
    { label: 'Products', path: '/admin/products', icon: Package, hasDropdown: true },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Banners', path: '/admin/banners', icon: Image, hasDropdown: true },
    { label: 'Blogs', path: '/admin/blogs', icon: FileText, hasDropdown: true },
    { label: 'Manage Logo', path: '/admin/logo', icon: Layers },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-950 text-zinc-100">
      
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="pb-3 border-b border-zinc-800">
            <h2 className="text-sm font-black text-zinc-100 uppercase tracking-wider">Admin Control</h2>
            <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold uppercase rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
              {user?.role} Portal
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.hasDropdown && (
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1 pt-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-sm text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
          <div className="text-[11px] text-zinc-500 font-mono pt-2">
            FastAPI Engine Connected
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};
