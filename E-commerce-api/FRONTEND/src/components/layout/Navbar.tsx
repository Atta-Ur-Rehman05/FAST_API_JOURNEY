import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, LogOut, LayoutDashboard, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartStore } from '../../store/cartStore';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const { cart, toggleCart } = useCartStore();
  const navigate = useNavigate();

  const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              NEXUS STORE
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-slate-300 hover:text-indigo-400 font-medium transition-colors">
              Storefront
            </Link>
            {user && (
              <>
                <Link to="/account/orders" className="text-slate-300 hover:text-indigo-400 font-medium transition-colors">
                  My Orders
                </Link>
                <Link to="/account/addresses" className="text-slate-300 hover:text-indigo-400 font-medium transition-colors">
                  Address Book
                </Link>
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Admin Portal Toggle Button */}
            {(isAdmin || isSeller) && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all text-sm font-medium"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Hub</span>
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={toggleCart}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Account Menu */}
            {user ? (
              <div className="flex items-center space-x-3 border-l border-slate-700/60 pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-200">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-indigo-400 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-l border-slate-700/60 pl-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
