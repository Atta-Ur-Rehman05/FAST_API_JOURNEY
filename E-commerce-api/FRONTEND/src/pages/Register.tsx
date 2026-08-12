import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md ui-surface rounded-sm p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-100 mx-auto flex items-center justify-center border border-zinc-700">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Create ZetaMall Account</h1>
          <p className="text-xs text-zinc-400">Join ZetaMall Store for instant deals and vouchers</p>
        </div>

        {error && (
          <div className="p-3 rounded-xs bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-100 uppercase tracking-wider mb-1">First Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                  className="w-full pl-9 pr-3 py-2 border border-zinc-700 rounded-xs text-xs text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-100 uppercase tracking-wider mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
                className="w-full px-3 py-2 border border-zinc-700 rounded-xs text-xs text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-100 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 border border-zinc-700 rounded-xs text-xs text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-100 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-zinc-700 rounded-xs text-xs text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register Now'}
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-700 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-zinc-100 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
