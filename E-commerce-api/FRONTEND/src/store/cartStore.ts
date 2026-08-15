import { create } from 'zustand';
import type { Cart } from '../types/api';
import { apiClient } from '../lib/api-client';

interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isOpen: false,
  isLoading: false,
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get<Cart>('/cart/me');
      set({ cart: res.data, isLoading: false });
    } catch {
      set({ cart: null, isLoading: false });
    }
  },

  addItem: async (variantId: string, quantity: number) => {
    set({ isLoading: true });
    try {
      await apiClient.post('/cart/items', { variant_id: variantId, quantity });
      await get().fetchCart();
      get().openCart();
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (itemId: number, quantity: number) => {
    set({ isLoading: true });
    try {
      await apiClient.patch(`/cart/items/${itemId}`, { quantity });
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (itemId: number) => {
    set({ isLoading: true });
    try {
      await apiClient.delete(`/cart/items/${itemId}`);
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await apiClient.delete('/cart/clear');
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },
}));
