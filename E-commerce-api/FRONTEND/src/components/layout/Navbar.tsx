import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, LogOut, LayoutDashboard, Search, User as UserIcon, Sparkles, Grid2X2, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useCartStore } from '../../store/cartStore';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { cart, toggleCart } = useCartStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/products?search=${encodeURIComponent(searchQuery.trim())}` : '/products');
    setIsMenuOpen(false);
  };
  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = () => { logout(); closeMenu(); navigate('/login'); };

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="border-b border-zinc-800/60 bg-zinc-950 px-4 py-1.5 text-[11px] text-zinc-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-zinc-200" /> Dispatch-grade essentials. Free delivery over Rs. 5,000.</span>
          <div className="hidden sm:flex items-center gap-3 font-semibold">
            {user ? <span>SIGNED IN: {user.first_name.toUpperCase()}</span> : <><Link to="/login" className="hover:text-white">LOGIN</Link><Link to="/register" className="hover:text-white">CREATE ACCOUNT</Link></>}
          </div>
        </div>
      </div>
      <div className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 md:gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-2" onClick={closeMenu}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 text-lg font-black text-zinc-950" aria-hidden="true">Z</span>
            <span className="hidden text-lg font-black tracking-tight text-zinc-100 sm:inline">ZETA <span className="font-medium text-zinc-500">MALL</span></span>
          </Link>
          <nav className="hidden shrink-0 items-center gap-1 lg:flex" aria-label="Primary navigation">
            <Link to="/products" className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-zinc-800">Shop</Link>
            {user && <Link to="/account/orders" className="px-3 py-2 text-sm font-bold text-zinc-400 hover:text-white">My Orders</Link>}
            {isAdmin && <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-zinc-400 hover:text-white"><Grid2X2 className="h-4 w-4" />Admin</button>}
          </nav>
          <form onSubmit={handleSearchSubmit} className="relative flex flex-1 max-w-2xl">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search the catalog" aria-label="Search the catalog" className="ui-input rounded-full py-2 pl-4 pr-11 text-sm" />
            <button type="submit" className="ui-icon-button absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1.5" aria-label="Search"><Search className="h-4 w-4" /></button>
          </form>
          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && <button onClick={() => navigate('/admin')} className="hidden items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 md:flex"><LayoutDashboard className="h-3.5 w-3.5" /> Control</button>}
            <button onClick={toggleCart} className="relative rounded-full border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 transition hover:text-white" aria-label="Shopping cart"><ShoppingCart className="h-5 w-5" />{totalItems > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-100 px-1 font-mono text-[10px] font-black text-zinc-950">{totalItems}</span>}</button>
            {user ? <div className="hidden items-center gap-1 border-l border-zinc-800 pl-2 sm:flex"><Link to="/account/orders" className="ui-icon-button p-1.5" aria-label="My orders"><UserIcon className="h-4 w-4" /></Link><button onClick={handleLogout} className="ui-icon-button p-1.5" aria-label="Logout"><LogOut className="h-4 w-4" /></button></div> : <Link to="/login" className="hidden rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-900 sm:block">Sign in</Link>}
            <button onClick={() => setIsMenuOpen((open) => !open)} className="ui-icon-button rounded-md p-2 lg:hidden" aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isMenuOpen} aria-controls="mobile-navigation">{isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {isMenuOpen && (
          <nav id="mobile-navigation" className="mx-auto mt-3 max-w-7xl border-t border-zinc-800 pt-3 lg:hidden" aria-label="Mobile navigation">
            <div className="grid gap-1 pb-1 text-sm font-bold">
              <Link to="/products" onClick={closeMenu} className="rounded-md bg-zinc-900 px-3 py-2.5 text-zinc-100 hover:bg-zinc-800">Shop</Link>
              {user ? <><Link to="/account/orders" onClick={closeMenu} className="rounded-md px-3 py-2.5 text-zinc-300 hover:bg-zinc-900">My Orders</Link><Link to="/account/addresses" onClick={closeMenu} className="rounded-md px-3 py-2.5 text-zinc-300 hover:bg-zinc-900">Addresses</Link>{isAdmin && <Link to="/admin" onClick={closeMenu} className="rounded-md px-3 py-2.5 text-zinc-300 hover:bg-zinc-900">Admin control</Link>}<button onClick={handleLogout} className="rounded-md px-3 py-2.5 text-left text-zinc-300 hover:bg-zinc-900">Sign out</button></> : <><Link to="/login" onClick={closeMenu} className="rounded-md px-3 py-2.5 text-zinc-300 hover:bg-zinc-900">Sign in</Link><Link to="/register" onClick={closeMenu} className="rounded-md px-3 py-2.5 text-zinc-300 hover:bg-zinc-900">Create account</Link></>}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
