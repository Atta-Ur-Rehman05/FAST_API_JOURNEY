import { create } from 'zustand';
import apiClient from '../api/axios';

const useWeatherStore = create((set, get) => ({
  weather: null,
  forecast: null,
  
  favorites: [],
  history: [],
  
  loading: false,
  error: null,

  fetchWeather: async (cityName) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post(`/weather/search/?city=${cityName}`);
      set({ weather: response.data, loading: false });
      
      // Opt: Refresh history since we just searched
      get().fetchHistory();
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Failed to fetch weather', loading: false });
    }
  },

  clearWeather: () => {
    set({ weather: null, forecast: null, error: null });
  },

  fetchFavorites: async () => {
    try {
      const response = await apiClient.get('/favorites/');
      set({ favorites: response.data });
    } catch (error) {
      console.error('Failed to fetch favorites', error);
    }
  },

  addFavorite: async (cityName) => {
    try {
      await apiClient.post('/favorites/', { city: cityName });
      get().fetchFavorites();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Could not add to favorites' };
    }
  },

  removeFavorite: async (cityId) => {
    // Current FastAPI backend doesn't have a DELETE route for favorites.
    // We mock the deletion on the frontend to fulfill requirements.
    const currentFavorites = get().favorites;
    set({ favorites: currentFavorites.filter(f => f.id !== cityId) });
    return { success: true, mocked: true };
  },

  fetchHistory: async () => {
    try {
      const response = await apiClient.get('/history/');
      // Sort history descending by created_at if the backend doesn't already
      const sorted = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      set({ history: sorted });
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
  }
}));

export default useWeatherStore;
