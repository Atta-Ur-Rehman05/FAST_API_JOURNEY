import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Truck, XCircle, Ban } from 'lucide-react';
import type { Order, PaginatedResponse } from '../types/api';
import { apiClient } from '../lib/api-client';
import { formatPrice } from '../lib/format-price';
import { toast } from 'sonner';
import { useConfirm } from '../hooks/useConfirm';
import { EmptyState } from '../components/ui/EmptyState';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

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

  const cancelOrder = async (orderId: string) => {
    const ok = await confirm({
      title: 'Cancel order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
      confirmLabel: 'Cancel Order',
      variant: 'danger',
    });
    if (!ok) return;
    setCancellingId(orderId);
    try {
      await apiClient.post(`/orders/${orderId}/cancel`);
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, order_status: 'cancelled' as const } : order));
      toast.success('Order cancelled');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const isCancellable = (status: string) => status === 'draft' || status === 'pending';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /><span>Delivered</span></span>;
      case 'shipped':
        return <span className="px-2.5 py-0.5 rounded-xs bg-zinc-900 text-zinc-100 border border-zinc-700 text-[11px] font-bold uppercase flex items-center gap-1"><Truck className="w-3 h-3" /><span>Shipped</span></span>;
      case 'processing':
        return <span className="px-2.5 py-0.5 rounded-xs bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3" /><span>Processing</span></span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-xs bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold uppercase flex items-center gap-1"><XCircle className="w-3 h-3" /><span>Cancelled</span></span>;
      case 'failed':
        return <span className="px-2.5 py-0.5 rounded-xs bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold uppercase flex items-center gap-1"><XCircle className="w-3 h-3" /><span>Failed</span></span>;
      case 'draft':
        return <span className="px-2.5 py-0.5 rounded-xs bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-bold uppercase">Draft</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-xs bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-bold uppercase">Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">My Order History</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Track shipment progress and manage past purchases</p>
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading order history...</div>
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders placed yet" description="Your purchased orders will appear here once submitted." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            return (
              <div key={order.id} className="ui-surface p-5 rounded-sm space-y-3 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-700 pb-3 gap-2">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Order ID</span>
                  <h3 className="text-sm font-bold font-mono text-zinc-100">{order.id}</h3>
                </div>

                <div className="flex items-center space-x-4">
                  {getStatusBadge(order.order_status)}
                  <span className="text-base font-black text-zinc-100">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Order Items Breakdown */}
              {order.order_status === 'draft' && (
                <p className="text-[11px] text-zinc-400">This draft order can still be edited.</p>
              )}
              <div className="space-y-1.5">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex flex-wrap justify-between items-center gap-2 text-xs p-2.5 rounded-xs bg-zinc-900/50 border border-zinc-800">
                    <span className="text-zinc-100 font-mono text-[11px]">
                      SKU: {item.variant?.sku || `#${item.variant_id.slice(0, 8)}`} (Qty: {item.quantity})
                    </span>
                    <span className="font-bold text-zinc-100">
                      {formatPrice(item.price_per_item)} / ea
                    </span>
                  </div>
                ))}
              </div>

              {/* Cancel button for draft/pending orders */}
              {isCancellable(order.order_status) && (
                <div className="flex justify-end pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => cancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200 rounded-xs hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
      {dialog}
    </div>
  );
};