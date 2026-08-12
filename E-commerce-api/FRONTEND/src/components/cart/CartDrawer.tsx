import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

export const CartDrawer: React.FC = () => {
  const { cart, isOpen, closeCart, updateItem, removeItem, clearCart, isLoading } = useCartStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const totalAmount = cart?.items?.reduce((sum, item) => {
    return sum + (Number(item.unit_price) * item.quantity);
  }, 0) || 0;

  return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-4 bg-zinc-950 text-zinc-100 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5" />
              <h2 className="text-base font-bold uppercase tracking-wide">My Shopping Cart</h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1 text-zinc-400 hover:text-white rounded-md transition-colors"
              title="Close Cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950">
            {!cart?.items || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-12 space-y-3">
                <ShoppingBag className="w-12 h-12 stroke-1 text-zinc-600" />
                <p className="text-sm font-bold text-zinc-100">Your cart is empty</p>
                <p className="text-xs text-zinc-500">Browse items in our storefront to start shopping.</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center space-x-3"
                >
                  <div className="w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold text-zinc-500 flex-shrink-0 border border-zinc-800">
                    SKU: {item.variant?.sku?.slice(0, 6) || 'VAR'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-100 truncate">
                      Variant {item.variant?.sku || `#${item.variant_id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs font-mono font-black text-zinc-100 mt-0.5">
                      Rs. {Number(item.unit_price).toFixed(2)}
                    </p>

                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)}
                        disabled={isLoading}
                        className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors border border-zinc-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold text-zinc-100 px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors border border-zinc-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {cart?.items && cart.items.length > 0 && (
            <div className="p-4 border-t border-zinc-800 space-y-3 bg-zinc-950">
              <div className="flex justify-between items-center text-xs text-zinc-500">
                <span className="font-semibold uppercase tracking-wider">Subtotal</span>
                <span className="text-lg font-mono font-black text-zinc-100">
                  Rs. {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-md border border-zinc-800 text-xs font-semibold text-zinc-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                >
                  Clear
                </button>

                <button
                  onClick={() => {
                    closeCart();
                    navigate('/checkout');
                  }}
                  className="flex-1 btn-primary text-xs py-2 px-4 flex items-center justify-center space-x-2 shadow-xs"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
