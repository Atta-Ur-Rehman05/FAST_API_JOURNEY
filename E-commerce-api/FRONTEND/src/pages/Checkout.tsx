import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, Truck } from 'lucide-react';
import type { Address, PaymentMethod, CheckoutResponse } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCartStore();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>('');
  const [selectedBillingId, setSelectedBillingId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<CheckoutResponse | null>(null);

  useEffect(() => {
    const initCheckout = async () => {
      try {
        await fetchCart();
        const addrRes = await apiClient.get<Address[]>('/addresses/');
        setAddresses(addrRes.data);
        const defaultShipping = addrRes.data.find(a => a.is_default_shipping) || addrRes.data[0];
        const defaultBilling = addrRes.data.find(a => a.is_default_billing) || addrRes.data[0];
        if (defaultShipping) setSelectedShippingId(defaultShipping.id);
        if (defaultBilling) setSelectedBillingId(defaultBilling.id);
      } catch (err) {
        console.error('Error initializing checkout:', err);
      } finally {
        setLoading(false);
      }
    };
    initCheckout();
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShippingId || !selectedBillingId) {
      alert('Please select both shipping and billing addresses.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post<CheckoutResponse>('/checkout/', {
        shipping_address_id: selectedShippingId,
        billing_address_id: selectedBillingId,
        payment_method: paymentMethod,
      });
      setOrderResult(res.data);
      await fetchCart();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to complete checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading checkout session...</div>;
  }

  if (orderResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Order Confirmed!</h1>
        <p className="text-slate-400">Thank you for your purchase. Your order has been placed successfully.</p>

        <div className="glass-panel p-6 rounded-2xl text-left space-y-3 font-mono text-sm">
          <p className="text-slate-400">Order ID: <span className="text-indigo-400 font-bold">{orderResult.order.id}</span></p>
          <p className="text-slate-400">Total Paid: <span className="text-white font-bold">${Number(orderResult.order.total_amount).toFixed(2)}</span></p>
          <p className="text-slate-400">Payment Status: <span className="text-emerald-400 capitalize">{orderResult.payment.payment_status}</span></p>
        </div>

        <div className="flex justify-center space-x-4">
          <button onClick={() => navigate('/account/orders')} className="px-6 py-3 bg-indigo-600 rounded-xl text-white font-semibold">
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <h1 className="text-3xl font-extrabold text-white">Checkout</h1>
        <p className="text-slate-400 text-sm mt-1">Review items and select shipping details</p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Address & Payment Selection */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shipping Address Selection */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              <span>Select Shipping Address</span>
            </h2>

            {addresses.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/40 text-slate-400 text-sm">
                No addresses found. <button type="button" onClick={() => navigate('/account/addresses')} className="text-indigo-400 underline">Add Address</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedShippingId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedShippingId === addr.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <p className="font-bold text-slate-200">{addr.full_name}</p>
                    <p className="text-xs text-slate-300 mt-1">{addr.address_line_1}</p>
                    <p className="text-xs text-slate-400">{addr.city}, {addr.state} {addr.postal_code}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <span>Payment Method</span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'credit_card', label: 'Credit Card' },
                { id: 'paypal', label: 'PayPal' },
                { id: 'stripe', label: 'Stripe' },
                { id: 'cod', label: 'Cash on Delivery' },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                  className={`p-4 rounded-2xl border text-sm font-semibold transition-all ${
                    paymentMethod === pm.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary */}
        <div className="glass-panel p-6 rounded-3xl h-fit space-y-6">
          <h2 className="text-lg font-bold text-white">Order Summary</h2>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {cart?.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm text-slate-300">
                <span className="truncate pr-2 font-mono text-xs">SKU: {item.variant?.sku || item.variant_id.slice(0, 6)} (x{item.quantity})</span>
                <span className="font-mono font-bold">${((item.variant?.price_modifier || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Shipping Fee</span>
              <span className="text-emerald-400">FREE</span>
            </div>
            <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-slate-800">
              <span>Total</span>
              <span className="font-mono">${(cart?.items?.reduce((sum, item) => sum + (item.variant?.price_modifier || 0) * item.quantity, 0) || 0).toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedShippingId}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40"
          >
            {submitting ? 'Processing Order...' : 'Complete Purchase'}
          </button>
        </div>

      </form>
    </div>
  );
};
