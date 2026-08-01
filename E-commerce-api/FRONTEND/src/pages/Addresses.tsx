import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, Star } from 'lucide-react';
import type { Address } from '../types/api';
import { apiClient } from '../lib/api-client';

export const Addresses: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    address_type: 'Home' as const,
  });

  const fetchAddresses = async () => {
    try {
      const res = await apiClient.get<Address[]>('/addresses/');
      setAddresses(res.data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/addresses/', formData);
      setShowAddModal(false);
      fetchAddresses();
      setFormData({
        full_name: '',
        phone: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        address_type: 'Home',
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add address.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await apiClient.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch (err) {
      alert('Failed to delete address.');
    }
  };

  const setDefaultShipping = async (id: string) => {
    try {
      await apiClient.patch(`/addresses/${id}/default-shipping`);
      fetchAddresses();
    } catch (err) {
      alert('Failed to update default shipping address.');
    }
  };

  const setDefaultBilling = async (id: string) => {
    try {
      await apiClient.patch(`/addresses/${id}/default-billing`);
      fetchAddresses();
    } catch (err) {
      alert('Failed to update default billing address.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Address Book</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your shipping and billing locations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-lg font-bold text-slate-300">No addresses saved yet</p>
          <p className="text-sm text-slate-500">Add an address to speed up your checkout process.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((addr) => (
            <div key={addr.id} className="glass-panel p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-mono font-bold uppercase">
                    {addr.address_type}
                  </span>
                  <button onClick={() => handleDelete(addr.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white">{addr.full_name}</h3>
                <p className="text-sm text-slate-300">{addr.address_line_1} {addr.address_line_2}</p>
                <p className="text-sm text-slate-400">{addr.city}, {addr.state} {addr.postal_code}</p>
                <p className="text-xs text-slate-500 font-mono">{addr.country} • Phone: {addr.phone}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col space-y-2 text-xs">
                <button
                  onClick={() => setDefaultShipping(addr.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
                    addr.is_default_shipping
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{addr.is_default_shipping ? 'Default Shipping' : 'Set Default Shipping'}</span>
                </button>

                <button
                  onClick={() => setDefaultBilling(addr.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
                    addr.is_default_billing
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>{addr.is_default_billing ? 'Default Billing' : 'Set Default Billing'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold text-white">Add New Address</h2>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <input
                type="text"
                required
                placeholder="Address Line 1"
                value={formData.address_line_1}
                onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Postal Code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
