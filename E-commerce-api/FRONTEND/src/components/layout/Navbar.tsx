import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, LayoutDashboard, Search, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartStore } from '../../store/cartStore';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { cart, toggleCart } = useCartStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/products?search=${encodeURIComponent(searchQuery.trim())}` : '/products');
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="border-b border-zinc-800/60 bg-zinc-950 px-4 py-1.5 text-[11px] text-zinc-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-zinc-200" /> Dispatch-grade essentials. Free delivery over Rs. 5,000.</span>
          <div className="flex items-center gap-3 font-semibold">
            {user ? <span className="hidden sm:inline">SIGNED IN: {user.first_name.toUpperCase()}</span> : <><Link to="/login" className="hover:text-white">LOGIN</Link><Link to="/register" className="hover:text-white">CREATE ACCOUNT</Link></>}
          </div>
        </div>
      </div>
      <div className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 md:gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="rounded-md bg-zinc-100 px-2.5 py-1 font-black tracking-tight text-zinc-950">ZETA.MALL</span>
            <span className="hidden border-l border-zinc-800 pl-2 text-[10px] font-bold tracking-[.2em] text-zinc-500 sm:inline">SUPPLY CO.</span>
          </Link>
          <form onSubmit={handleSearchSubmit} className="relative flex flex-1 max-w-2xl">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search the catalog" className="w-full rounded-full border border-zinc-800 bg-zinc-900 py-2 pl-4 pr-11 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600" />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-zinc-400 hover:text-white" aria-label="Search"><Search className="h-4 w-4" /></button>
          </form>
          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && <button onClick={() => navigate('/admin')} className="hidden items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 md:flex"><LayoutDashboard className="h-3.5 w-3.5" /> Control</button>}
            <button onClick={toggleCart} className="relative rounded-full border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 transition hover:text-white" aria-label="Shopping cart"><ShoppingCart className="h-5 w-5" />{totalItems > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-100 px-1 font-mono text-[10px] font-black text-zinc-950">{totalItems}</span>}</button>
            {user ? <div className="hidden items-center gap-1 border-l border-zinc-800 pl-2 sm:flex"><Link to="/account/orders" className="rounded p-1.5 text-zinc-400 hover:text-white" aria-label="My orders"><UserIcon className="h-4 w-4" /></Link><button onClick={() => { logout(); navigate('/login'); }} className="rounded p-1.5 text-zinc-400 hover:text-white" aria-label="Logout"><LogOut className="h-4 w-4" /></button></div> : <Link to="/login" className="hidden rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-900 sm:block">Sign in</Link>}
          </div>
        </div>
      </div>
    </header>
  );
};
