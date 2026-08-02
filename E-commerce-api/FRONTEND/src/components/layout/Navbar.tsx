import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, LayoutDashboard, Search, User as UserIcon, HelpCircle, Smartphone, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartStore } from '../../store/cartStore';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const { cart, toggleCart } = useCartStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-md">
      
      {/* 1. Top Utility Announcement Strip (Daraz Brand Standard) */}
      <div className="bg-[#E04B00] text-white text-[11px] font-medium py-1 px-4 border-b border-[#F85606]/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="hover:underline cursor-pointer flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-[#E7FFFD]" /> SAVE MORE ON APP
            </span>
            <span className="hover:underline cursor-pointer">SELL ON DARAZ</span>
            <span className="hover:underline cursor-pointer flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> HELP & SUPPORT
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <span className="text-[#E7FFFD]">Welcome, {user.first_name}!</span>
            ) : (
              <>
                <Link to="/login" className="hover:underline font-semibold">LOGIN</Link>
                <span>|</span>
                <Link to="/register" className="hover:underline font-semibold">SIGN UP</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar (International Orange #F85606) */}
      <div className="bg-[#F85606] text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
            <div className="bg-white text-[#F85606] font-black tracking-wider px-2.5 py-0.5 rounded-sm text-xl flex items-center shadow-sm">
              <Tag className="w-5 h-5 mr-1 fill-[#F85606]" />
              <span>Daraz</span>
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-widest text-[#E7FFFD] border-l border-white/30 pl-2">
              Store
            </span>
          </Link>

          {/* Search Bar Container */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in Daraz"
              className="w-full py-2 pl-4 pr-12 text-sm text-[#212121] bg-white rounded-sm focus:outline-none placeholder-gray-400 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-4 bg-[#FFE8DE] hover:bg-white text-[#F85606] rounded-r-sm flex items-center justify-center transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Right Navigation & Actions */}
          <div className="flex items-center space-x-4 sm:space-x-6 flex-shrink-0">
            
            {/* Admin Hub Switcher */}
            {(isAdmin || isSeller) && (
              <button
                onClick={() => navigate('/admin')}
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-sm bg-[#E7FFFD] text-[#0f766e] text-xs font-bold hover:bg-white transition-all shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin Hub</span>
              </button>
            )}

            {/* Shopping Cart Button with Light Blue Accent Badge */}
            <button
              onClick={toggleCart}
              className="relative p-1.5 text-white hover:text-[#E7FFFD] transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-7 h-7" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-[#E7FFFD] text-[#F85606] text-xs font-black rounded-full flex items-center justify-center px-1 shadow-md border border-white">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Account / User Menu */}
            {user ? (
              <div className="flex items-center space-x-3 border-l border-white/30 pl-4">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold leading-tight">{user.first_name} {user.last_name}</p>
                  <p className="text-[10px] text-[#E7FFFD] capitalize">{user.role}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Link to="/account/orders" className="p-1 hover:text-[#E7FFFD]" title="My Orders">
                    <UserIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="p-1 hover:text-[#E7FFFD]"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 border-l border-white/30 pl-4">
                <Link
                  to="/login"
                  className="text-xs font-semibold px-3 py-1.5 rounded-sm bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

    </header>
  );
};
