import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Order, OrderStatus } from '../../types/api';
import { apiClient } from '../../lib/api-client';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get<Order[]>('/orders/me');
      setOrders(res.data);
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Order Fulfillment Hub</h1>
          <p className="text-slate-400 text-sm mt-1">Manage system order statuses and dispatch workflows</p>
        </div>
        <button onClick={fetchOrders} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading fulfillment queue...</div>
      ) : orders.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center text-slate-400">
          No orders found in queue.
        </div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-xs font-mono border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-400">{o.id}</td>
                    <td className="px-6 py-4 font-mono font-bold text-white">${Number(o.total_amount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold uppercase">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={o.order_status}
                        disabled={updatingId === o.id}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value as OrderStatus)}
                        className="px-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="pending" className="bg-slate-900">Pending</option>
                        <option value="processing" className="bg-slate-900">Processing</option>
                        <option value="shipped" className="bg-slate-900">Shipped</option>
                        <option value="delivered" className="bg-slate-900">Delivered</option>
                        <option value="cancelled" className="bg-slate-900">Cancelled</option>
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
