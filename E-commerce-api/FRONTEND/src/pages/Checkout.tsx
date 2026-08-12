import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { Address, PaymentMethod, CheckoutResponse } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface StripePaymentFormProps {
  onSuccess: () => Promise<void>;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);
    try {
      const { error: validationError } = await elements.submit();
      if (validationError) {
        setError(validationError.message || 'Please check your payment details.');
        return;
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/account/orders`,
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        setError(paymentError.message || 'Your payment could not be confirmed.');
        return;
      }

      if (paymentIntent?.status !== 'succeeded') {
        setError('Your payment is still processing. Check your order history shortly.');
        return;
      }

      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ui-surface max-w-xl mx-auto p-6 rounded-sm space-y-5 shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Complete Stripe payment</h1>
        <p className="text-xs text-zinc-400 mt-1">Your order will be confirmed once Stripe approves the payment.</p>
      </div>
      <PaymentElement />
      {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xs p-3">{error}</p>}
      <button type="submit" disabled={!stripe || submitting} className="btn-primary w-full text-xs font-bold py-3 disabled:opacity-50">
        {submitting ? 'Confirming payment...' : 'Pay securely'}
      </button>
    </form>
  );
};

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const cart = useCartStore((state) => state.cart);
  const fetchCart = useCartStore((state) => state.fetchCart);
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>('');
  const [selectedBillingId, setSelectedBillingId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<CheckoutResponse | null>(null);
  const [stripeCheckout, setStripeCheckout] = useState<CheckoutResponse | null>(null);
  // One idempotency key per checkout session; retries after failures reuse it so
  // the backend can dedupe, and a fresh key is minted after a successful order.
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    const initCheckout = async () => {
      try {
        await fetchCart();
        const addrRes = await apiClient.get<{items: Address[], total: number}>('/addresses/');
        const addrList = addrRes.data.items;
        setAddresses(addrList);
        const defaultShipping = addrList.find(a => a.is_default_shipping) || addrList[0];
        const defaultBilling = addrList.find(a => a.is_default_billing) || addrList[0];
        if (defaultShipping) setSelectedShippingId(defaultShipping.id);
        if (defaultBilling) setSelectedBillingId(defaultBilling.id);
      } catch (err) {
        console.error('Error initializing checkout:', err);
      } finally {
        setLoading(false);
      }
    };
    initCheckout();
  }, [fetchCart]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShippingId || !selectedBillingId) {
      alert('Please select both shipping and billing addresses.');
      return;
    }
    if (paymentMethod === 'stripe' && !stripePromise) {
      alert('Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY and try again.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post<CheckoutResponse>(
        '/checkout/',
        {
          shipping_address_id: selectedShippingId,
          billing_address_id: selectedBillingId,
          payment_method: paymentMethod,
        },
        { headers: { 'Idempotency-Key': idempotencyKeyRef.current } }
      );
      await fetchCart();
      idempotencyKeyRef.current = crypto.randomUUID();
      if (paymentMethod === 'stripe') {
        if (!res.data.stripe_client_secret) {
          throw new Error('Stripe checkout did not return a client secret.');
        }
        setStripeCheckout(res.data);
      } else {
        setOrderResult(res.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to complete checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-zinc-400 font-medium">Loading checkout session...</div>;
  }

  if (orderResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-zinc-100">Order Placed Successfully!</h1>
          <p className="text-xs text-zinc-400">Thank you for your purchase. We are processing your package for delivery.</p>
        </div>

        <div className="ui-surface p-6 rounded-sm text-left space-y-2 font-mono text-xs shadow-xs">
          <p className="text-zinc-400">Order ID: <span className="text-zinc-100 font-bold">{orderResult.order.id}</span></p>
          <p className="text-zinc-400">Total Amount: <span className="text-zinc-100 font-bold">Rs. {Number(orderResult.order.total_amount).toFixed(2)}</span></p>
          <p className="text-zinc-400">Payment Status: <span className="text-emerald-700 capitalize font-bold">{orderResult.payment.payment_status}</span></p>
        </div>

        <div className="flex justify-center">
          <button onClick={() => navigate('/account/orders')} className="btn-primary text-xs font-bold py-2.5 px-6">
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  if (stripeCheckout?.stripe_client_secret && stripePromise) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Elements stripe={stripePromise} options={{ clientSecret: stripeCheckout.stripe_client_secret }}>
          <StripePaymentForm
            onSuccess={async () => {
              setOrderResult(stripeCheckout);
              setStripeCheckout(null);
              await fetchCart();
            }}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Checkout & Order Summary</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Select delivery address and payment option to place order</p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shipping Address Selection */}
          <div className="ui-surface p-6 rounded-sm space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center space-x-2 border-b border-zinc-700 pb-3">
              <Truck className="w-4 h-4 text-zinc-100" />
              <span>Select Shipping Location</span>
            </h2>

            {addresses.length === 0 ? (
              <div className="p-4 rounded-xs bg-zinc-900 text-zinc-400 text-xs space-y-2">
                <p>No saved addresses found in your account.</p>
                <button type="button" onClick={() => navigate('/account/addresses')} className="btn-accent text-xs">
                  + Add Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedShippingId(addr.id)}
                    className={`p-3 rounded-xs border cursor-pointer transition-all ${
                      selectedShippingId === addr.id
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-xs text-zinc-100">{addr.full_name}</p>
                      <span className="text-[10px] font-bold text-zinc-200 bg-zinc-900 px-1.5 py-0.5 rounded-xs border border-zinc-700">
                        {addr.address_type}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-100 mt-1">{addr.address_line_1}</p>
                    <p className="text-[11px] text-zinc-400">{addr.city}, {addr.state} {addr.postal_code}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Ph: {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="ui-surface p-6 rounded-sm space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center space-x-2 border-b border-zinc-700 pb-3">
              <CreditCard className="w-4 h-4 text-zinc-100" />
              <span>Select Payment Method</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'credit_card', label: 'Credit / Debit Card' },
                { id: 'paypal', label: 'PayPal' },
                { id: 'stripe', label: 'Stripe Gateway' },
                { id: 'cod', label: 'Cash on Delivery' },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                  className={`p-3 rounded-xs border text-xs font-bold transition-all text-left ${
                    paymentMethod === pm.id
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary */}
        <div className="ui-surface p-6 rounded-sm space-y-4 h-fit shadow-xs">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider border-b border-zinc-700 pb-3">
            Order Summary
          </h2>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {cart?.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs text-zinc-100 pb-2 border-b border-zinc-800">
                <span className="truncate pr-2 font-mono text-[11px]">
                  SKU: {item.variant?.sku || item.variant_id.slice(0, 6)} (x{item.quantity})
                </span>
                <span className="font-bold text-zinc-100">
                  Rs. {(Number(item.unit_price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-700 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="font-semibold text-zinc-100">
                Rs. {(cart?.items?.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0) || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-zinc-100 font-black text-base pt-2 border-t border-zinc-700">
              <span>Total Amount</span>
              <span className="text-zinc-100">
                Rs. {(cart?.items?.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0) || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !selectedShippingId}
              className="btn-primary w-full text-xs font-bold py-3 flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
            >
              <span>{submitting ? 'Processing Order...' : 'Place Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center space-x-1 text-[11px] text-zinc-200 bg-zinc-900 p-2 rounded-xs border border-zinc-700">
            <ShieldCheck className="w-4 h-4 text-zinc-100" />
            <span>Safe & Secure Checkout Guaranteed</span>
          </div>
        </div>

      </form>
    </div>
  );
};
