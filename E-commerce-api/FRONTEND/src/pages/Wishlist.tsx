import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import type { WishlistItem } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';
import { toast } from 'sonner';
import { useConfirm } from '../hooks/useConfirm';
import { EmptyState } from '../components/ui/EmptyState';

export const WishlistPage: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { confirm: _confirm, dialog } = useConfirm();

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<WishlistItem[]>('/wishlist/items');
      setItems(res.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await apiClient.delete(`/wishlist/items/${productId}`);
      setItems((current) => current.filter((item) => item.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove item from wishlist.');
    }
  };

  const handleMoveToCart = async (productId: string) => {
    try {
      await addItem(productId, 1);
      toast.success('Moved to cart');
    } catch {
      toast.error('Failed to add item to cart.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          My Wishlist
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">Items you have saved for later</p>
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading wishlist...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" description="Save items you love by clicking the heart icon on any product." action={<button onClick={() => navigate('/products')} className="btn-primary text-xs font-bold py-2 px-6">Browse Products</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="ui-card p-4 rounded-sm flex flex-col justify-between space-y-3">
              <div>
                <p className="text-sm font-bold text-zinc-100">Product {item.product_id.slice(0, 8)}</p>
                <p className="text-[11px] text-zinc-400">Added {new Date(item.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleMoveToCart(item.product_id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 text-zinc-950 text-xs font-bold rounded-md hover:bg-zinc-200">
                  <ShoppingCart className="w-3.5 h-3.5" /> Move to Cart
                </button>
                <button onClick={() => handleRemove(item.product_id)} className="p-2 text-zinc-400 hover:text-rose-600 border border-zinc-700 rounded-md">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {dialog}
    </div>
  );
};
