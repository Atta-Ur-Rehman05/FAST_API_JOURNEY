import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

export const CartDrawer: React.FC = () => {
  const { cart, isOpen, closeCart, updateItem, removeItem, clearCart, isLoading } = useCartStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const totalAmount = cart?.items?.reduce((sum, item) => {
    const basePrice = item.variant?.price_modifier || 0;
    return sum + (basePrice * item.quantity);
  }, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-6 h-6 text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-100">Shopping Cart</h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!cart?.items || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                <ShoppingBag className="w-16 h-16 stroke-1 mb-4 text-slate-600" />
                <p className="text-lg font-semibold text-slate-400">Your cart is empty</p>
                <p className="text-sm mt-1 text-slate-500">Discover items in our storefront to start shopping.</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center space-x-4"
                >
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center font-mono text-xs text-slate-400">
                    SKU: {item.variant?.sku?.slice(0, 6) || 'VAR'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      Variant {item.variant?.sku || `#${item.variant_id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-indigo-400 font-mono mt-0.5">
                      ${((item.variant?.price_modifier || 0)).toFixed(2)}
                    </p>

                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-3 mt-2">
                      <button
                        onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)}
                        disabled={isLoading}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-semibold text-slate-200">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {cart?.items && cart.items.length > 0 && (
            <div className="p-6 border-t border-slate-800 space-y-4 bg-slate-900/90">
              <div className="flex justify-between items-center text-slate-300">
                <span>Subtotal</span>
                <span className="text-xl font-bold text-white font-mono">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={clearCart}
                  disabled={isLoading}
                  className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-red-400 text-sm font-medium transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/checkout');
                  }}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>Checkout</span>
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
