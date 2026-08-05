import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Warehouse, Folders, ShoppingCart, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 ui-surface rounded-sm text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#212121]">Access Denied</h2>
        <p className="text-sm text-[#757575]">You must be an administrator to access the Admin Hub.</p>
        <button onClick={() => navigate('/products')} className="btn-primary w-full text-sm">
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#EFF0F5]">
      
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-4 flex flex-col justify-between shadow-xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <h2 className="text-sm font-bold text-[#212121] uppercase tracking-wider">Admin Hub</h2>
              <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold uppercase rounded-xs bg-[#E7FFFD] text-[#0f766e] border border-[#b2f5f0]">
                {user?.role} Portal
              </span>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="p-1.5 text-gray-500 hover:text-[#F85606] transition-colors rounded-sm"
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
                      ? 'bg-[#F85606] text-white font-semibold shadow-xs'
                      : 'text-gray-700 hover:bg-[#EFF0F5] hover:text-[#F85606]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-500 font-mono">
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
