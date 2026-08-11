import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md ui-surface rounded-sm p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FFE8DE] text-[#F85606] mx-auto flex items-center justify-center border border-[#F85606]/30">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#212121]">Welcome Back</h1>
          <p className="text-xs text-[#757575]">Sign in to your account to start shopping</p>
        </div>

        {error && (
          <div className="p-3 rounded-xs bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#212121] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-xs text-xs text-[#212121] placeholder-gray-400 focus:outline-none focus:border-[#F85606]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#212121] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-xs text-xs text-[#212121] placeholder-gray-400 focus:outline-none focus:border-[#F85606]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-2 border-t border-gray-200 text-center text-xs text-[#757575] space-y-1">
          <div>
            Don't have an account yet?{' '}
            <Link to="/register" className="text-[#F85606] font-bold hover:underline">
              Create account
            </Link>
          </div>
          <div>
            <Link to="/forgot-password" className="text-[#F85606] font-bold hover:underline">
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
