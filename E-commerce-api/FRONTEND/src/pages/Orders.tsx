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
        return <span className="px-2.5 py-0.5 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /><span>Delivered</span></span>;
      case 'shipped':
        return <span className="px-2.5 py-0.5 rounded-xs bg-[#E7FFFD] text-[#0284C7] border border-[#b2f5f0] text-[11px] font-bold uppercase flex items-center gap-1"><Truck className="w-3 h-3" /><span>Shipped</span></span>;
      case 'processing':
        return <span className="px-2.5 py-0.5 rounded-xs bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3" /><span>Processing</span></span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-xs bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold uppercase flex items-center gap-1"><XCircle className="w-3 h-3" /><span>Cancelled</span></span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-xs bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-bold uppercase">Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#212121]">My Order History</h1>
        <p className="text-xs text-[#757575] mt-0.5">Track shipment progress and manage past purchases</p>
      </div>

      {loading ? (
        <div className="text-center text-[#757575] text-xs py-12">Loading order history...</div>
      ) : orders.length === 0 ? (
        <div className="ui-surface p-12 rounded-sm text-center space-y-3 shadow-xs">
          <Package className="w-10 h-10 text-gray-400 mx-auto" />
          <p className="text-base font-bold text-[#212121]">No orders placed yet</p>
          <p className="text-xs text-[#757575]">Your purchased orders will appear here once submitted.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="ui-surface p-5 rounded-sm space-y-3 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-3 gap-2">
                <div>
                  <span className="text-[10px] text-[#757575] uppercase tracking-wider font-bold">Order ID</span>
                  <h3 className="text-sm font-bold font-mono text-[#F85606]">{order.id}</h3>
                </div>

                <div className="flex items-center space-x-4">
                  {getStatusBadge(order.order_status)}
                  <span className="text-base font-black text-[#212121]">
                    Rs. {Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order Items Breakdown */}
              <div className="space-y-1.5">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs p-2.5 rounded-xs bg-[#EFF0F5]/50 border border-gray-100">
                    <span className="text-[#212121] font-mono text-[11px]">
                      SKU: {item.variant?.sku || `#${item.variant_id.slice(0, 8)}`} (Qty: {item.quantity})
                    </span>
                    <span className="font-bold text-[#F85606]">
                      Rs. {Number(item.price_per_item).toFixed(2)} / ea
                    </span>
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
