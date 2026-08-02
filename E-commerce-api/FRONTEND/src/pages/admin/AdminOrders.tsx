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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#212121]">Order Fulfillment Hub</h1>
          <p className="text-xs text-[#757575] mt-0.5">Manage order status transitions and dispatch workflow</p>
        </div>
        <button onClick={fetchOrders} className="p-2 bg-white hover:bg-gray-100 border border-gray-300 text-[#757575] rounded-xs shadow-2xs">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center text-[#757575] text-xs py-12">Loading fulfillment queue...</div>
      ) : orders.length === 0 ? (
        <div className="ui-surface p-12 rounded-sm text-center text-[#757575] text-xs">
          No active orders found in the queue.
        </div>
      ) : (
        <div className="ui-surface rounded-sm overflow-hidden border border-gray-200 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#EFF0F5] text-[#757575] uppercase text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#F85606]">{o.id}</td>
                    <td className="px-4 py-3 font-mono font-black text-[#212121]">
                      Rs. {Number(o.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-xs bg-[#E7FFFD] text-[#0f766e] border border-[#b2f5f0] text-[10px] font-bold uppercase">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.order_status}
                        disabled={updatingId === o.id}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value as OrderStatus)}
                        className="px-2.5 py-1 bg-white border border-gray-300 rounded-xs text-[#212121] font-mono text-xs focus:outline-none focus:border-[#F85606]"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
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
