import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, Pencil, Star } from 'lucide-react';
import type { Address } from '../types/api';
import { apiClient } from '../lib/api-client';

export const Addresses: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    address_type: 'Home' as Address['address_type'],
  });

  const fetchAddresses = async () => {
    try {
      const res = await apiClient.get<{items: Address[], total: number}>('/addresses/');
      setAddresses(res.data.items);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => setFormData({
    full_name: '', phone: '', address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: '', address_type: 'Home' as Address['address_type'],
  });

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await apiClient.put(`/addresses/${editingAddressId}`, formData);
      } else {
        await apiClient.post('/addresses/', formData);
      }
      setShowAddModal(false);
      setEditingAddressId(null);
      fetchAddresses();
      resetForm();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add address.');
    }
  };

  const startEditing = (address: Address) => {
    setEditingAddressId(address.id);
    setFormData({
      full_name: address.full_name, phone: address.phone, address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || '', city: address.city, state: address.state,
      postal_code: address.postal_code, country: address.country, address_type: address.address_type,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await apiClient.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch {
      alert('Failed to delete address.');
    }
  };

  const setDefaultShipping = async (id: string) => {
    try {
      await apiClient.patch(`/addresses/${id}/default-shipping`);
      fetchAddresses();
    } catch {
      alert('Failed to update default shipping address.');
    }
  };

  const setDefaultBilling = async (id: string) => {
    try {
      await apiClient.patch(`/addresses/${id}/default-billing`);
      fetchAddresses();
    } catch {
      alert('Failed to update default billing address.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Address Book</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Manage your shipping and billing delivery locations</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingAddressId(null); setShowAddModal(true); }}
          className="btn-primary text-xs font-bold flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading address book...</div>
      ) : addresses.length === 0 ? (
        <div className="ui-surface p-12 rounded-sm text-center space-y-3 shadow-xs">
          <MapPin className="w-10 h-10 text-zinc-400 mx-auto" />
          <p className="text-base font-bold text-zinc-100">No saved addresses</p>
          <p className="text-xs text-zinc-400">Add an address to speed up checkout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="ui-surface p-5 rounded-sm flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-xs bg-zinc-900 text-zinc-200 text-[10px] font-bold uppercase border border-zinc-700">
                    {addr.address_type}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => startEditing(addr)} className="text-zinc-400 hover:text-zinc-100 transition-colors" aria-label="Edit address"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(addr.id)} className="text-zinc-400 hover:text-rose-600 transition-colors" aria-label="Delete address"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-zinc-100 pt-1">{addr.full_name}</h3>
                <p className="text-xs text-zinc-100">{addr.address_line_1} {addr.address_line_2}</p>
                <p className="text-xs text-zinc-400">{addr.city}, {addr.state} {addr.postal_code}</p>
                <p className="text-[11px] text-zinc-400">Country: {addr.country} • Ph: {addr.phone}</p>
              </div>

              <div className="pt-3 border-t border-zinc-700 flex flex-col space-y-1.5 text-xs">
                <button
                  onClick={() => setDefaultShipping(addr.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xs border text-[11px] font-semibold transition-colors ${
                    addr.is_default_shipping
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{addr.is_default_shipping ? 'Default Shipping' : 'Set Default Shipping'}</span>
                </button>

                <button
                  onClick={() => setDefaultBilling(addr.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xs border text-[11px] font-semibold transition-colors ${
                    addr.is_default_billing
                      ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-900'
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

      {/* Add Address Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 p-6 rounded-sm space-y-4 shadow-xl border border-zinc-700">
            <h2 className="text-base font-bold text-zinc-100 border-b border-zinc-700 pb-2">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h2>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
                <input
                  type="text"
                  required
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <input
                type="text"
                required
                placeholder="Address Line 1"
                value={formData.address_line_1}
                onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
              />

              <input
                type="text"
                placeholder="Address Line 2 (optional)"
                value={formData.address_line_2}
                onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Postal Code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
                <input
                  type="text"
                  required
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingAddressId(null); resetForm(); }}
                  className="px-3 py-2 border border-zinc-700 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs font-bold py-2 px-4"
                >
                  {editingAddressId ? 'Save Changes' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
