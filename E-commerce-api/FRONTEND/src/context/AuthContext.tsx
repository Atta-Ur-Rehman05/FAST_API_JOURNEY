import React, { createContext, useState, useEffect } from 'react';
import type { User } from '../types/api';
import { apiClient, refreshAccessToken, setAccessToken } from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  isCustomer: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = await refreshAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await apiClient.get<User>('/users/me');
      setUser(response.data);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', pass);

    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    setAccessToken(response.data.access_token);
    const currentUser = await apiClient.get<User>('/users/me');
    setUser(currentUser.data);
    setIsLoading(false);
  };

  const register = async (data: { email: string; password: string; first_name: string; last_name: string }) => {
    await apiClient.post('/auth/register', data);
    await login(data.email, data.password);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Logout remains idempotent client-side even if the server call fails.
    }
    setAccessToken(null);
    setUser(null);
  };

  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isCustomer, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
