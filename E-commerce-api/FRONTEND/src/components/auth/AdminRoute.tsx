import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 ui-surface rounded-sm text-center space-y-4 shadow-sm">
        <div className="text-sm text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 ui-surface rounded-sm text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
          <span className="text-lg font-bold">🚫</span>
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-400">You must be an administrator to access the Admin Hub.</p>
        <Navigate to="/products" replace />
      </div>
    );
  }

  return <>{children}</>;
};
