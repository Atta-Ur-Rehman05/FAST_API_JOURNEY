import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../lib/api-client';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/password-reset/request', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to request a password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md ui-surface rounded-sm p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-100 mx-auto flex items-center justify-center border border-zinc-700">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Forgot Password</h1>
          <p className="text-xs text-zinc-400">Enter your account email and we will send reset instructions.</p>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xs bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-3 rounded-xs bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-700 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>If the account exists, password reset instructions have been sent.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-100 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xs text-xs text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-xs font-bold shadow-xs disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-zinc-700 text-center text-xs text-zinc-400">
          <Link to="/login" className="text-zinc-100 font-bold hover:underline">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};
