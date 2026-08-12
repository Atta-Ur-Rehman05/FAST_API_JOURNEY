import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, RefreshCcw, Send, ShieldCheck, Truck } from 'lucide-react';
import type { Category, PaginatedResponse } from '../../types/api';
import { apiClient } from '../../lib/api-client';

const assurances = [
  { icon: Truck, title: 'Free Express Shipping', text: 'On all orders over Rs. 5,000' },
  { icon: ShieldCheck, title: 'Secure Stripe Payments', text: '256-Bit SSL Encrypted' },
  { icon: RefreshCcw, title: '30-Day Money Back', text: 'Hassle-free return policy' },
  { icon: CreditCard, title: 'Flexible Checkout', text: 'Cards, Apple Pay, PayPal' },
];

export const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiClient.get<PaginatedResponse<Category>>('/categories/', { params: { limit: 5, root_only: true } })
      .then((response) => setCategories(response.data.items))
      .catch((error) => console.error('Unable to load footer categories:', error));
  }, []);

  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="border-b border-zinc-800">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:gap-8">
          {assurances.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-zinc-800 text-zinc-100"><Icon className="h-6 w-6" /></span>
              <div><h3 className="text-sm font-black text-zinc-100">{title}</h3><p className="mt-1 text-xs">{text}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Link to="/products" className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-zinc-50"><span className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-950">Z</span>ZETAMALL</Link>
          <p className="mt-5 max-w-sm text-sm leading-6">ZetaMall — next-generation modern digital marketplace. Crafted for high performance, minimalism, and precision.</p>
          <p className="mt-7 text-xs font-bold tracking-[.12em] text-zinc-300">SUBSCRIBE TO NEWSLETTER</p>
          <form className="mt-3 flex max-w-md gap-2" onSubmit={(event) => event.preventDefault()}>
            <input type="email" aria-label="Email address" placeholder="Enter your email" className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm outline-none focus:border-zinc-500" />
            <button type="submit" className="btn-primary gap-1.5 px-4 text-sm">Join <Send className="h-4 w-4" /></button>
          </form>
        </div>

        <div><h3 className="text-sm font-black text-zinc-100">CATALOG</h3><div className="mt-4 space-y-3 text-sm">{categories.length ? categories.map((category) => <Link key={category.id} to={`/products?category_id=${category.id}`} className="block hover:text-white">{category.name}</Link>) : <Link to="/products" className="block hover:text-white">Browse products</Link>}</div></div>
        <div><h3 className="text-sm font-black text-zinc-100">CUSTOMER CARE</h3><div className="mt-4 space-y-3 text-sm"><Link to="/account/orders" className="block hover:text-white">Track Order</Link><Link to="/account/addresses" className="block hover:text-white">Shipping Info</Link><a href="mailto:support@zetamall.example" className="block hover:text-white">Returns &amp; Refunds</a><a href="mailto:support@zetamall.example" className="block hover:text-white">FAQ &amp; Support</a><a href="mailto:support@zetamall.example" className="block hover:text-white">Contact Us</a></div></div>
        <div><h3 className="text-sm font-black text-zinc-100">DEVELOPER &amp; STACK</h3><div className="mt-4 space-y-3 text-sm"><p>Backend: FastAPI REST</p><p>Frontend: React 19 + Vite</p><p>State: Zustand &amp; React Query</p><p>Styling: Tailwind CSS v4</p><p>Auth: JWT Interceptors</p></div></div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-zinc-800 px-5 py-7 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© 2026 ZetaMall Inc. All rights reserved.</span><span>Built with precision for modern e-commerce.</span></div>
    </footer>
  );
};
