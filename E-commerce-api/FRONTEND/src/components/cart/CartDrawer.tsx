import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

export const CartDrawer: React.FC = () => {
  const { cart, isOpen, closeCart, updateItem, removeItem, clearCart, isLoading } = useCartStore();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const dismissCart = useCallback(() => {
    closeCart();
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, [closeCart]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissCart();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dismissCart, isOpen]);

  if (!isOpen) return null;

  const totalAmount = cart?.items?.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0) || 0;
  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) dismissCart(); }}>
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cart-title" onKeyDown={trapFocus} className="flex w-screen max-w-md flex-col border-l border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 p-4 text-zinc-100">
            <div className="flex items-center space-x-2"><ShoppingBag className="w-5 h-5" aria-hidden="true" /><h2 id="cart-title" className="text-base font-bold uppercase tracking-wide">My Shopping Cart</h2></div>
            <button ref={closeButtonRef} onClick={dismissCart} className="ui-icon-button p-1" aria-label="Close shopping cart"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-950 p-4">
            {!cart?.items || cart.items.length === 0 ? <div className="flex h-full flex-col items-center justify-center space-y-3 py-12 text-center text-zinc-500"><ShoppingBag className="w-12 h-12 stroke-1 text-zinc-600" aria-hidden="true" /><p className="text-sm font-bold text-zinc-100">Your cart is empty</p><p className="text-xs text-zinc-500">Browse items in our storefront to start shopping.</p></div> : cart.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"><div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800 font-mono text-[10px] font-bold text-zinc-500">SKU: {item.variant?.sku?.slice(0, 6) || 'VAR'}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-zinc-100">Variant {item.variant?.sku || `#${item.variant_id.slice(0, 8)}`}</p><p className="mt-0.5 text-xs font-mono font-black text-zinc-100">Rs. {Number(item.unit_price).toFixed(2)}</p><div className="mt-2 flex items-center space-x-2"><button onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)} disabled={isLoading} className="rounded-md border border-zinc-700 bg-zinc-800 p-1 text-zinc-100 hover:bg-zinc-700" aria-label={`Decrease quantity for ${item.variant?.sku || 'item'}`}><Minus className="w-3 h-3" /></button><span aria-label={`Quantity ${item.quantity}`} className="px-1 text-xs font-mono font-bold text-zinc-100">{item.quantity}</span><button onClick={() => updateItem(item.id, item.quantity + 1)} disabled={isLoading} className="rounded-md border border-zinc-700 bg-zinc-800 p-1 text-zinc-100 hover:bg-zinc-700" aria-label={`Increase quantity for ${item.variant?.sku || 'item'}`}><Plus className="w-3 h-3" /></button></div></div><button onClick={() => removeItem(item.id)} className="ui-icon-button p-1.5 hover:text-rose-400" aria-label={`Remove ${item.variant?.sku || 'item'} from cart`}><Trash2 className="w-4 h-4" /></button></div>
            ))}
          </div>
          {cart?.items && cart.items.length > 0 && <div className="space-y-3 border-t border-zinc-800 bg-zinc-950 p-4"><div className="flex items-center justify-between text-xs text-zinc-500"><span className="font-semibold uppercase tracking-wider">Subtotal</span><span className="text-lg font-mono font-black text-zinc-100">Rs. {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div><div className="flex gap-2"><button onClick={clearCart} disabled={isLoading} className="rounded-md border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-400 hover:bg-rose-950/40 hover:text-rose-300">Clear</button><button onClick={() => { dismissCart(); navigate('/checkout'); }} className="btn-primary flex flex-1 items-center justify-center space-x-2 px-4 py-2 text-xs"><span>Proceed to Checkout</span><ArrowRight className="w-4 h-4" /></button></div></div>}
        </div>
      </div>
    </div>
  );
};
