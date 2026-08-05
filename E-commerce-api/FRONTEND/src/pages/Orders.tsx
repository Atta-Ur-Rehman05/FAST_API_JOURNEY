import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Save, Trash2, Truck, XCircle } from 'lucide-react';
import type { Order, PaginatedResponse } from '../types/api';
import { apiClient } from '../lib/api-client';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get<PaginatedResponse<Order>>('/orders/me');
        setOrders(res.data.items);
      } catch (err) {
        console.error('Error loading orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const updateItem = async (orderId: string, itemId: number, quantity: number) => {
    if (quantity <= 0) return;
    setUpdatingItemId(itemId);
    try {
      const response = await apiClient.patch(`/orders/${orderId}/items/${itemId}`, { quantity });
      setOrders((current) => current.map((order) => order.id !== orderId ? order : {
        ...order, items: order.items.map((item) => item.id === itemId ? { ...item, ...response.data } : item),
      }));
    } catch (err: any) { alert(err.response?.data?.detail || 'Failed to update order item.'); }
    finally { setUpdatingItemId(null); }
  };

  const deleteItem = async (orderId: string, itemId: number) => {
    if (!confirm('Remove this item from the order?')) return;
    try {
      await apiClient.delete(`/orders/${orderId}/items/${itemId}`);
      setOrders((current) => current.map((order) => order.id !== orderId ? order : { ...order, items: order.items.filter((item) => item.id !== itemId) }));
    } catch (err: any) { alert(err.response?.data?.detail || 'Failed to remove order item.'); }
  };

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
                  <div key={item.id} className="flex flex-wrap justify-between items-center gap-2 text-xs p-2.5 rounded-xs bg-[#EFF0F5]/50 border border-gray-100">
                    <span className="text-[#212121] font-mono text-[11px]">
                      SKU: {item.variant?.sku || `#${item.variant_id.slice(0, 8)}`} (Qty: {item.quantity})
                    </span>
                    <span className="font-bold text-[#F85606]">
                      Rs. {Number(item.price_per_item).toFixed(2)} / ea
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input type="number" min="1" value={itemQuantities[item.id] ?? item.quantity} onChange={(e) => setItemQuantities({ ...itemQuantities, [item.id]: Math.max(1, Number(e.target.value) || 1) })} className="w-14 p-1 border border-gray-300 rounded-xs text-xs font-mono" aria-label="Item quantity" />
                      <button onClick={() => updateItem(order.id, item.id, itemQuantities[item.id] ?? item.quantity)} disabled={updatingItemId === item.id} className="p-1 text-[#F85606] hover:bg-[#FFE8DE]" title="Update quantity"><Save className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem(order.id, item.id)} className="p-1 text-rose-600 hover:bg-rose-50" title="Remove item"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
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
