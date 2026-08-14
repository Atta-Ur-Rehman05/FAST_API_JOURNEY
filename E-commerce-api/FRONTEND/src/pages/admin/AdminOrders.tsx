import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, CreditCard } from 'lucide-react';
import type { Order, OrderStatus, PaginatedResponse, Payment } from '../../types/api';
import { apiClient } from '../../lib/api-client';
import { formatPrice } from '../../lib/format-price';

const statusLabels: Record<OrderStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  draft: ['pending'],
  pending: ['processing', 'cancelled', 'failed'],
  processing: ['shipped', 'cancelled', 'failed'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  failed: [],
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<Order>>('/orders/', {
        params: searchQuery ? { search: searchQuery } : undefined,
      });
      setOrders(res.data.items);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { order_status: newStatus });
      fetchOrders();
    } catch {
      alert('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    try { await apiClient.delete(`/orders/${orderId}`); fetchOrders(); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to delete order.'); }
  };

  const handleRefund = async (orderId: string, payment: Payment | undefined) => {
    if (!payment?.id) return;
    if (!confirm(`Refund payment of ${formatPrice(payment.amount)} for this order?`)) return;
    setRefundingId(orderId);
    try {
      await apiClient.post(`/payments/${payment.id}/refund`);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to refund payment.');
    } finally {
      setRefundingId(null);
    }
  };

  const canRefund = (order: Order) => {
    const p = order.payment;
    return p?.payment_method === 'stripe' && p.payment_status === 'completed';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Order Fulfillment Hub</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Manage order status transitions and dispatch workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
          />
          <button onClick={fetchOrders} className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xs shadow-2xs">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading fulfillment queue...</div>
      ) : orders.length === 0 ? (
        <div className="ui-surface p-12 rounded-sm text-center text-zinc-400 text-xs">
          No active orders found in the queue.
        </div>
      ) : (
        <div className="ui-surface rounded-sm overflow-hidden border border-zinc-700 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-100">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[11px] font-bold border-b border-zinc-700">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((o) => (
                  <React.Fragment key={o.id}>
                    <tr key={o.id} className="hover:bg-zinc-900 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-zinc-100">{o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-zinc-300">{o.user_id.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-mono font-black text-zinc-100">
                        {formatPrice(o.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                          o.payment?.payment_status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          o.payment?.payment_status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          o.payment?.payment_status === 'refunded' ? 'bg-zinc-100 text-zinc-600 border-zinc-300' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {o.payment?.payment_status || 'no_payment'}
                        </span>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{o.payment?.payment_method || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-xs bg-zinc-900 text-zinc-200 border border-zinc-700 text-[10px] font-bold uppercase">
                          {o.order_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded-xs"
                          title="View details"
                        >
                          {expandedOrderId === o.id ? 'Hide' : 'Details'}
                        </button>
                        {canRefund(o) && (
                          <button
                            onClick={() => handleRefund(o.id, o.payment)}
                            disabled={refundingId === o.id}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-xs disabled:opacity-50"
                            title="Refund payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteOrder(o.id)} className="p-1.5 text-zinc-400 hover:text-rose-600" title="Delete order"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                    {expandedOrderId === o.id && (
                      <tr key={`${o.id}-detail`} className="bg-zinc-900/30">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="text-xs space-y-2">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                              <div><span className="text-zinc-500">Order ID:</span> <span className="font-mono text-zinc-100">{o.id}</span></div>
                              <div><span className="text-zinc-500">User ID:</span> <span className="font-mono text-zinc-100">{o.user_id}</span></div>
                              <div><span className="text-zinc-500">Shipping:</span> <span className="text-zinc-100">{o.shipping_address_id.slice(0, 8)}</span></div>
                              <div><span className="text-zinc-500">Billing:</span> <span className="text-zinc-100">{o.billing_address_id.slice(0, 8)}</span></div>
                              {o.payment && (
                                <>
                                  <div><span className="text-zinc-500">Transaction:</span> <span className="font-mono text-zinc-100">{o.payment.transaction_id || '—'}</span></div>
                                  <div><span className="text-zinc-500">Payment Method:</span> <span className="text-zinc-100">{o.payment.payment_method}</span></div>
                                </>
                              )}
                            </div>
                            <div className="border-t border-zinc-800 pt-2">
                              <p className="text-zinc-400 font-bold mb-1">Items ({o.items?.length || 0})</p>
                              <div className="space-y-1">
                                {o.items?.map((item) => (
                                  <div key={item.id} className="flex justify-between text-[11px] bg-zinc-900/50 p-2 rounded-xs border border-zinc-800">
                                    <span className="text-zinc-300">SKU: {item.variant?.sku || item.variant_id.slice(0, 8)} × {item.quantity}</span>
                                    <span className="font-mono text-zinc-100">{formatPrice(item.price_per_item)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="border-t border-zinc-800 pt-2">
                              <p className="text-zinc-500 text-[10px]">Status Transitions: {allowedTransitions[o.order_status].join(' → ') || 'Terminal'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
