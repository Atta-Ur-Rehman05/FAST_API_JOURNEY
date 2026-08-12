import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import type { Order, OrderStatus, PaginatedResponse } from '../../types/api';
import { apiClient } from '../../lib/api-client';

const statusLabels: Record<OrderStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  draft: ['cancelled'],
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get<PaginatedResponse<Order>>('/orders/');
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
    } catch (err) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Order Fulfillment Hub</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Manage order status transitions and dispatch workflow</p>
        </div>
        <button onClick={fetchOrders} className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xs shadow-2xs">
          <RefreshCw className="w-4 h-4" />
        </button>
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
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3">Actions</th>
                  <th className="px-4 py-3">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-zinc-100">{o.id}</td>
                    <td className="px-4 py-3 font-mono font-black text-zinc-100">
                      Rs. {Number(o.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-xs bg-zinc-900 text-zinc-200 border border-zinc-700 text-[10px] font-bold uppercase">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-3"><button onClick={() => handleDeleteOrder(o.id)} className="p-1.5 text-zinc-400 hover:text-rose-600" title="Delete order"><Trash2 className="w-4 h-4" /></button></td>
                    <td className="px-4 py-3">
                      <select
                        value={o.order_status}
                        disabled={updatingId === o.id || allowedTransitions[o.order_status].length === 0}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value as OrderStatus)}
                        className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-xs text-zinc-100 font-mono text-xs focus:outline-none focus:border-zinc-700"
                      >
                        <option value={o.order_status}>{statusLabels[o.order_status]}</option>
                        {allowedTransitions[o.order_status].map((status) => (
                          <option key={status} value={status}>{statusLabels[status]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
