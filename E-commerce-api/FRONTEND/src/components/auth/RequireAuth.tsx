import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 ui-surface rounded-sm text-center space-y-4 shadow-sm">
        <div className="text-sm text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
