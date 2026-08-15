import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api/v1' : '');

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL must be configured for this environment.');
}

const CSRF_COOKIE_NAME = 'csrftoken';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function getCsrfToken(): string | null {
  return getCookie(CSRF_COOKIE_NAME);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The access token exists only in memory. The refresh token is an HttpOnly
// cookie, so JavaScript cannot read it.
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    didRefreshFail = false;
  }
};

// Request interceptor: Attach the in-memory access token and CSRF token when available.
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const method = config.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise: Promise<string | null> | null = null;
let didRefreshFail = false;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (didRefreshFail) {
    return null;
  }
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
    didRefreshFail = false;
    setAccessToken(res.data.access_token);
    return res.data.access_token as string;
  } catch {
    didRefreshFail = true;
    setAccessToken(null);
    return null;
  }
};

// Response interceptor: try a silent refresh once on 401, then fall back to login redirect
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const isAuthEndpoint = (originalRequest.url || '').includes('/auth/');
    const isLoginPage = window.location.pathname === '/login';
    const isRegisterPage = window.location.pathname === '/register';

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest.__retriedWithRefresh) {
      originalRequest.__retriedWithRefresh = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers = { ...(originalRequest.headers || {}), Authorization: `Bearer ${newToken}` };
        return apiClient(originalRequest);
      }
      setAccessToken(null);
      if (!isLoginPage && !isRegisterPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { getCsrfToken };
