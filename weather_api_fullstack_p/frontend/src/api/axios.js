import axios from 'axios';

// The base URL from environment variables, fallback is provided as per usual pattern if missing
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the authorization token
apiClient.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state && state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch (e) {
      console.error('Failed to parse auth storage in request interceptor', e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Global response error handler
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // You can handle unified error logging, redirecting on 401, etc.
    if (error.response) {
      if (error.response.status === 401) {
        // e.g., token expired. Assuming store handles clearing it via actions or component redirection
        console.warn('Unauthorized access - might need to login again.');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
