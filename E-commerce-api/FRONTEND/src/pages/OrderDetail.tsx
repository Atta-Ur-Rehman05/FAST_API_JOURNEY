import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, Ban, User, MapPin, Mail } from 'lucide-react';
import type { Order, OrderStatus } from '../types/api';
import { apiClient } from '../lib/api-client';
import { formatPrice } from '../lib/format-price';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const res = await apiClient.get<Order>(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4 text-zinc-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'processing': return <Package className="w-4 h-4 text-blue-400" />;
      case 'shipped': return <Truck className="w-4 h-4 text-indigo-400" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'failed': return <Ban className="w-4 h-4 text-rose-400" />;
      default: return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'draft': return 'bg-zinc-900 text-zinc-200 border-zinc-700';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'failed': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-zinc-900 text-zinc-200 border-zinc-700';
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-[.16em] text-zinc-500">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="ui-surface mx-auto my-12 max-w-7xl space-y-4 rounded-2xl px-4 py-16 text-center">
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-zinc-500">RECORD UNAVAILABLE</p>
        <h2 className="text-xl font-black text-zinc-100">Order not found</h2>
        <button onClick={() => navigate('/account/orders')} className="btn-primary text-xs">Return to Orders</button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <section className="border-b border-zinc-800 bg-zinc-950 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => navigate('/account/orders')}
            className="ui-icon-button flex w-fit items-center gap-2 px-2 py-1 text-xs font-bold mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to orders</span>
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-100">Order #{order.id.slice(0, 8)}</h1>
              <p className="text-xs text-zinc-400 mt-1">Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xs text-[10px] font-bold uppercase border ${getStatusColor(order.order_status)}`}>
                {getStatusIcon(order.order_status)}
                {order.order_status}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="ui-surface rounded-sm p-6 border border-zinc-700">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-4 border-b border-zinc-700 pb-3">Order Items ({order.items?.length || 0})</h2>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xs border border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <div className="relative flex aspect-square w-16 h-16 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                        <span className="text-zinc-400 text-xs">IMG</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-100 text-sm">{item.variant?.sku || `Variant ${item.variant_id.slice(0, 8)}`}</h3>
                        <p className="text-[11px] text-zinc-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <p className="font-mono font-bold text-zinc-100">{formatPrice(item.price_per_item)} / ea</p>
                      <p className="text-[11px] text-zinc-400">Total: {formatPrice(item.price_per_item * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ui-surface rounded-sm p-6 border border-zinc-700">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-4 border-b border-zinc-700 pb-3">Order Summary</h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-zinc-100">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="border-t border-zinc-700 pt-2 flex justify-between text-sm font-black text-zinc-100">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="ui-surface rounded-sm p-6 border border-zinc-700">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-4 border-b border-zinc-700 pb-3">Payment</h2>
              {order.payment && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Method</span>
                    <span className="text-zinc-100 capitalize">{order.payment.payment_method.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Status</span>
                    <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                      order.payment.payment_status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      order.payment.payment_status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      order.payment.payment_status === 'refunded' ? 'bg-zinc-100 text-zinc-600 border-zinc-300' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {order.payment.payment_status}
                    </span>
                  </div>
                  {order.payment.transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Transaction</span>
                      <span className="font-mono text-zinc-100 text-[11px] truncate max-w-[150px]">{order.payment.transaction_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-400">
                    <span>Amount</span>
                    <span className="text-zinc-100 font-mono">{formatPrice(order.payment.amount)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="ui-surface rounded-sm p-6 border border-zinc-700">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-4 border-b border-zinc-700 pb-3">Shipping Address</h2>
              {order.shipping_address && (
                <address className="not-italic text-sm text-zinc-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold text-zinc-100">{order.shipping_address.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span>{order.shipping_address.address_line_1}</span>
                  </div>
                  {order.shipping_address.address_line_2 && (
                    <div className="flex items-center gap-2 ml-6">
                      <MapPin className="w-4 h-4 text-zinc-400" />
                      <span>{order.shipping_address.address_line_2}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span>{order.shipping_address.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span>{order.shipping_address.phone}</span>
                  </div>
                </address>
              )}
            </div>

            {order.billing_address && order.billing_address.id !== order.shipping_address?.id && (
              <div className="ui-surface rounded-sm p-6 border border-zinc-700">
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-4 border-b border-zinc-700 pb-3">Billing Address</h2>
                <address className="not-italic text-sm text-zinc-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold text-zinc-100">{order.billing_address.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span>{order.billing_address.address_line_1}</span>
                  </div>
                  {order.billing_address.address_line_2 && (
                    <div className="flex items-center gap-2 ml-6">
                      <MapPin className="w-4 h-4 text-zinc-400" />
                      <span>{order.billing_address.address_line_2}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span>{order.billing_address.city}, {order.billing_address.state} {order.billing_address.postal_code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span>{order.billing_address.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span>{order.billing_address.phone}</span>
                  </div>
                </address>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};