import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { InventoryItem } from '../../types/api';
import { apiClient } from '../../lib/api-client';

export const AdminInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const fetchInventory = async () => {
    try {
      const res = await apiClient.get<InventoryItem[]>('/inventory/');
      setInventory(res.data);
      const initialQty: Record<string, number> = {};
      res.data.forEach((item) => {
        initialQty[item.variant_id] = item.stock_quantity;
      });
      setQuantities(initialQty);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateStock = async (variantId: string) => {
    setUpdatingId(variantId);
    try {
      await apiClient.patch(`/inventory/${variantId}/stock`, {
        stock_quantity: quantities[variantId],
        reason: 'Admin manual update',
      });
      fetchInventory();
    } catch (err) {
      alert('Failed to update stock quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#212121]">Inventory Stock Matrix</h1>
        <p className="text-xs text-[#757575] mt-0.5">View and update stock levels for all variant SKUs</p>
      </div>

      {loading ? (
        <div className="text-center text-[#757575] text-xs py-12">Loading inventory matrix...</div>
      ) : (
        <div className="ui-surface rounded-sm overflow-hidden border border-gray-200 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#EFF0F5] text-[#757575] uppercase text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Variant SKU</th>
                  <th className="px-4 py-3">Stock Quantity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Quick Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map((item) => {
                  const currentQty = quantities[item.variant_id] ?? item.stock_quantity;
                  const isOutOfStock = currentQty === 0;
                  const isLow = currentQty > 0 && currentQty <= item.low_stock_threshold;
                  return (
                    <tr key={item.variant_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-[#212121]">{item.product_name || 'Unnamed product'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#F85606]">{item.sku}</td>
                      <td className="px-4 py-3 font-mono">
                        <input
                          type="number"
                          min="0"
                          value={currentQty}
                          onChange={(e) => setQuantities({ ...quantities, [item.variant_id]: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-20 px-2 py-1 bg-white border border-gray-300 rounded-xs text-[#212121] font-mono text-xs focus:outline-none focus:border-[#F85606]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                          (isOutOfStock || isLow) ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isOutOfStock ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleUpdateStock(item.variant_id)}
                          disabled={updatingId === item.variant_id}
                          className="btn-primary text-xs py-1 px-3 flex items-center space-x-1 font-bold shadow-xs disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{updatingId === item.variant_id ? 'Saving...' : 'Save Stock'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
