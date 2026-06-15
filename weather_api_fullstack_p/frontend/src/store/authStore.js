import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        try {
          // Typically FastAPI uses form data for OAuth2 password bearer
          const formData = new URLSearchParams();
          formData.append('username', email); // Username is typically mapped to email in OAuth
          formData.append('password', password);

          const response = await apiClient.post('/login', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });
          
          const { access_token } = response.data;
          // Set rudimentary user state for now, maybe updated later when fetching user profile
          set({ token: access_token, user: { email } });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.detail || 'Login failed' };
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

export default useAuthStore;
