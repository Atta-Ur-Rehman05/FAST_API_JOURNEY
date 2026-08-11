import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../lib/api-client';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/password-reset/confirm', { token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired password reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md ui-surface rounded-sm p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FFE8DE] text-[#F85606] mx-auto flex items-center justify-center border border-[#F85606]/30">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#212121]">Set New Password</h1>
          <p className="text-xs text-[#757575]">Paste your reset token and choose a new password.</p>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xs bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-3 rounded-xs bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-700 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Password updated. Redirecting to sign in...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#212121] uppercase tracking-wider mb-1.5">Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Token from your email"
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xs text-xs font-mono text-[#212121] placeholder-gray-400 focus:outline-none focus:border-[#F85606]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#212121] uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xs text-xs text-[#212121] placeholder-gray-400 focus:outline-none focus:border-[#F85606]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#212121] uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xs text-xs text-[#212121] placeholder-gray-400 focus:outline-none focus:border-[#F85606]"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-xs font-bold shadow-xs disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-gray-200 text-center text-xs text-[#757575]">
          <Link to="/login" className="text-[#F85606] font-bold hover:underline">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};
