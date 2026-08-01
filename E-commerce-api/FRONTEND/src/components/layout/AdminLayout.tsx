import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Warehouse, Folders, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAdmin && !isSeller) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 glass-panel rounded-3xl text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-400">Access Denied</h2>
        <p className="text-sm text-slate-400">You must be an administrator or seller to access the Admin Hub.</p>
        <button onClick={() => navigate('/products')} className="px-6 py-2.5 bg-indigo-600 rounded-xl text-white font-semibold">
          Return to Storefront
        </button>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products & Variants', path: '/admin/products', icon: Package },
    { label: 'Inventory Matrix', path: '/admin/inventory', icon: Warehouse },
    { label: 'Categories', path: '/admin/categories', icon: Folders },
    { label: 'Orders Hub', path: '/admin/orders', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 glass-panel border-r border-slate-800 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Admin Hub</h2>
              <p className="text-xs text-purple-400 capitalize">{user?.role} Portal</p>
            </div>
            <button onClick={() => navigate('/products')} className="p-2 text-slate-400 hover:text-white" title="Back to Storefront">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 font-mono">
          FastAPI Engine Connected
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};
