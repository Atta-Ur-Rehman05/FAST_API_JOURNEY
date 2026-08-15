import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Warehouse, Folders, ShoppingCart, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products & Variants', path: '/admin/products', icon: Package },
    { label: 'Inventory Matrix', path: '/admin/inventory', icon: Warehouse },
    { label: 'Categories', path: '/admin/categories', icon: Folders },
    { label: 'Orders Hub', path: '/admin/orders', icon: ShoppingCart },
    { label: 'User Management', path: '/admin/users', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-950 text-zinc-100">
      
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-sm font-black text-zinc-100 uppercase tracking-wider">Admin Control</h2>
              <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold uppercase rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                {user?.role} Portal
              </span>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-md"
              title="Back to Storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 font-mono">
          FastAPI Engine Connected
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};
