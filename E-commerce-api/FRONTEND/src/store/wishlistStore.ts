import { create } from 'zustand';
import type { Wishlist, WishlistItem } from '../types/api';
import { apiClient } from '../lib/api-client';

interface WishlistState {
  wishlist: Wishlist | null;
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: null,
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get<Wishlist>('/wishlist/');
      set({ wishlist: res.data, isLoading: false });
    } catch {
      set({ wishlist: { id: '', user_id: '', items: [] }, isLoading: false });
    }
  },

  addItem: async (productId: string) => {
    set({ isLoading: true });
    try {
      await apiClient.post('/wishlist/items', { product_id: productId });
      await get().fetchWishlist();
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (productId: string) => {
    set({ isLoading: true });
    try {
      await apiClient.delete(`/wishlist/items/${productId}`);
      await get().fetchWishlist();
    } finally {
      set({ isLoading: false });
    }
  },

  clearWishlist: async () => {
    set({ isLoading: true });
    try {
      await apiClient.delete('/wishlist/clear');
      set({ wishlist: { id: get().wishlist?.id || '', user_id: get().wishlist?.user_id || '', items: [] } });
    } finally {
      set({ isLoading: false });
    }
  },

  isInWishlist: (productId: string) => {
    return get().wishlist?.items?.some((item: WishlistItem) => item.product_id === productId) || false;
  },
}));
