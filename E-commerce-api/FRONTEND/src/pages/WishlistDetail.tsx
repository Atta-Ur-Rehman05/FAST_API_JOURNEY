import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import type { WishlistResponse, WishlistItemResponse } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';

export const WishlistDetail: React.FC = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<WishlistResponse | null>(null);
  const [items, setItems] = useState<WishlistItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<WishlistResponse>('/wishlist/');
      setWishlist(res.data);
      setItems(res.data.items || []);
    } catch {
      setWishlist(null);
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
      if (wishlist) {
        setWishlist({ ...wishlist, items: wishlist.items.filter((item) => item.product_id !== productId) });
      }
    } catch {
      alert('Failed to remove item from wishlist.');
    }
  };

  const handleMoveToCart = async (productId: string) => {
    try {
      await addItem(productId, 1);
      await handleRemove(productId);
    } catch {
      alert('Failed to add item to cart.');
    }
  };

  const handleClearWishlist = async () => {
    if (!confirm('Clear your entire wishlist? This cannot be undone.')) return;
    try {
      await apiClient.delete('/wishlist/clear');
      setItems([]);
      setWishlist({ id: '', user_id: '', items: [], created_at: undefined });
    } catch {
      alert('Failed to clear wishlist.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            My Wishlist
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Items you have saved for later</p>
        </div>
        {wishlist && wishlist.items.length > 0 && (
          <button
            onClick={handleClearWishlist}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-md hover:bg-rose-100 border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Wishlist
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading wishlist...</div>
      ) : items.length === 0 ? (
        <div className="ui-surface p-12 rounded-sm text-center space-y-3">
          <Heart className="w-10 h-10 text-zinc-400 mx-auto" />
          <p className="text-base font-bold text-zinc-100">Your wishlist is empty</p>
          <p className="text-xs text-zinc-400">Save items you love by clicking the heart icon on any product.</p>
          <button onClick={() => navigate('/products')} className="btn-primary text-xs font-bold py-2 px-6">Browse Products</button>
        </div>
      ) : (
        <>
          {wishlist && (
            <div className="ui-surface p-4 rounded-sm border border-zinc-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Wishlist ID</span>
                <span className="font-mono text-zinc-100">{wishlist.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Items</span>
                <span className="font-bold text-zinc-100">{wishlist.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Created</span>
                <span className="text-zinc-100">{wishlist.created_at ? new Date(wishlist.created_at).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="ui-card p-4 rounded-sm flex flex-col justify-between space-y-3">
                <div>
                  <p className="text-sm font-bold text-zinc-100">Product {item.product_id.slice(0, 8)}</p>
                  <p className="text-[11px] text-zinc-400">Added {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently'}</p>
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
        </>
      )}
    </div>
  );
};