import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import type { Order } from '../types/api';
import { apiClient } from '../lib/api-client';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get<Order[]>('/orders/me');
        setOrders(res.data);
      } catch (err) {
        console.error('Error loading orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase flex items-center space-x-1.5"><CheckCircle className="w-3.5 h-3.5" /><span>Delivered</span></span>;
      case 'shipped':
        return <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase flex items-center space-x-1.5"><Truck className="w-3.5 h-3.5" /><span>Shipped</span></span>;
      case 'processing':
        return <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase flex items-center space-x-1.5"><Clock className="w-3.5 h-3.5" /><span>Processing</span></span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold uppercase flex items-center space-x-1.5"><XCircle className="w-3.5 h-3.5" /><span>Cancelled</span></span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs font-bold uppercase">Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Order History</h1>
        <p className="text-slate-400 text-sm mt-1">Track and manage your past purchases</p>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading order history...</div>
      ) : orders.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-lg font-bold text-slate-300">No orders placed yet</p>
          <p className="text-sm text-slate-500">Your order history will appear here after your first purchase.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-mono">Order ID</span>
                  <h3 className="text-lg font-bold font-mono text-indigo-400">{order.id}</h3>
                </div>

                <div className="flex items-center space-x-4">
                  {getStatusBadge(order.order_status)}
                  <span className="text-xl font-bold text-white font-mono">${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Order Items Breakdown */}
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm p-3 rounded-xl bg-slate-800/30">
                    <span className="text-slate-300 font-mono text-xs">SKU: {item.variant?.sku || `#${item.variant_id.slice(0, 8)}`} (x{item.quantity})</span>
                    <span className="font-mono text-slate-200 font-semibold">${Number(item.price_per_item).toFixed(2)} / ea</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
