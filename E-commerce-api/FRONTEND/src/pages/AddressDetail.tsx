import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, User, CheckCircle2, XCircle } from 'lucide-react';
import type { Address } from '../types/api';
import { apiClient } from '../lib/api-client';

export const AddressDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAddress = async () => {
    if (!id) return;
    try {
      const res = await apiClient.get<Address>(`/addresses/${id}`);
      setAddress(res.data);
    } catch (err) {
      console.error('Error fetching address:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddress();
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-[.16em] text-zinc-500">Loading address...</div>;
  }

  if (!address) {
    return (
      <div className="ui-surface mx-auto my-12 max-w-7xl space-y-4 rounded-2xl px-4 py-16 text-center">
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-zinc-500">RECORD UNAVAILABLE</p>
        <h2 className="text-xl font-black text-zinc-100">Address not found</h2>
        <button onClick={() => navigate('/account/addresses')} className="btn-primary text-xs">Return to Addresses</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-zinc-100" />
            Address Details
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">View and manage this address</p>
        </div>
        <button onClick={() => navigate('/account/addresses')} className="btn-primary text-xs font-bold py-2 px-6">
          Back to Addresses
        </button>
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading address...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ui-surface p-6 rounded-sm border border-zinc-700 space-y-4">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider border-b border-zinc-700 pb-3">Address Information</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-zinc-400 font-medium">Full Name</dt>
                <dd className="text-zinc-100 font-bold flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-zinc-400" />
                  {address.full_name}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400 font-medium">Address Type</dt>
                <dd className="text-zinc-100 flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <span className="px-2 py-0.5 rounded-xs bg-zinc-900 text-zinc-200 font-mono text-[10px] font-bold border border-zinc-700">
                    {address.address_type}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400 font-medium">Phone</dt>
                <dd className="text-zinc-100 flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-zinc-400" />
                  {address.phone}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400 font-medium">Address Line 1</dt>
                <dd className="text-zinc-100 mt-1">{address.address_line_1}</dd>
              </div>
              {address.address_line_2 && (
                <div>
                  <dt className="text-zinc-400 font-medium">Address Line 2</dt>
                  <dd className="text-zinc-100 mt-1">{address.address_line_2}</dd>
                </div>
              )}
              <div>
                <dt className="text-zinc-400 font-medium">City</dt>
                <dd className="text-zinc-100 mt-1">{address.city}</dd>
              </div>
              <div>
                <dt className="text-zinc-400 font-medium">State</dt>
                <dd className="text-zinc-100 mt-1">{address.state}</dd>
              </div>
              <div>
                <dt className="text-zinc-400 font-medium">Postal Code</dt>
                <dd className="text-zinc-100 mt-1">{address.postal_code}</dd>
              </div>
              <div>
                <dt className="text-zinc-400 font-medium">Country</dt>
                <dd className="text-zinc-100 mt-1">{address.country}</dd>
              </div>
            </dl>
          </div>

          <div className="ui-surface p-6 rounded-sm border border-zinc-700 space-y-4">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider border-b border-zinc-700 pb-3">Default Settings</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xs border border-zinc-700 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-400 text-xs">Default Shipping</p>
                    <p className="text-zinc-100 font-bold">{address.full_name}</p>
                  </div>
                </div>
                {address.is_default_shipping ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-xs border border-zinc-700 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-400 text-xs">Default Billing</p>
                    <p className="text-zinc-100 font-bold">{address.full_name}</p>
                  </div>
                </div>
                {address.is_default_billing ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 ui-surface p-6 rounded-sm border border-zinc-700 space-y-4">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider border-b border-zinc-700 pb-3">Full Address</h2>
          <address className="not-italic text-sm text-zinc-300 space-y-1">
            <p className="font-bold text-zinc-100">{address.full_name}</p>
            <p>{address.address_line_1}</p>
            {address.address_line_2 && <p>{address.address_line_2}</p>}
            <p>{address.city}, {address.state} {address.postal_code}</p>
            <p>{address.country}</p>
            <p>Phone: {address.phone}</p>
          </address>
</div>
    </>
    )}
    </div>
  );
};