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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-gray-200 shadow-xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-4 bg-[#F85606] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5" />
              <h2 className="text-base font-bold uppercase tracking-wide">My Shopping Cart</h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1 text-white hover:text-[#E7FFFD] rounded-xs transition-colors"
              title="Close Cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#EFF0F5]/50">
            {!cart?.items || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#757575] py-12 space-y-3">
                <ShoppingBag className="w-12 h-12 stroke-1 text-gray-400" />
                <p className="text-sm font-bold text-[#212121]">Your cart is empty</p>
                <p className="text-xs text-[#757575]">Browse items in our storefront to start shopping.</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xs bg-white border border-gray-200 flex items-center space-x-3 shadow-2xs"
                >
                  <div className="w-14 h-14 bg-[#EFF0F5] rounded-xs flex items-center justify-center font-mono text-[10px] font-bold text-[#757575] flex-shrink-0 border border-gray-200">
                    SKU: {item.variant?.sku?.slice(0, 6) || 'VAR'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#212121] truncate">
                      Variant {item.variant?.sku || `#${item.variant_id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs font-black text-[#F85606] mt-0.5">
                      Rs. {Number(item.unit_price).toFixed(2)}
                    </p>

                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)}
                        disabled={isLoading}
                        className="p-1 rounded-xs bg-gray-100 hover:bg-gray-200 text-[#212121] transition-colors border border-gray-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-[#212121] px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="p-1 rounded-xs bg-gray-100 hover:bg-gray-200 text-[#212121] transition-colors border border-gray-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors"
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
            <div className="p-4 border-t border-gray-200 space-y-3 bg-white">
              <div className="flex justify-between items-center text-xs text-[#757575]">
                <span className="font-semibold uppercase tracking-wider">Subtotal</span>
                <span className="text-lg font-black text-[#F85606]">
                  Rs. {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-xs border border-gray-300 text-xs font-semibold text-[#757575] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-colors"
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
