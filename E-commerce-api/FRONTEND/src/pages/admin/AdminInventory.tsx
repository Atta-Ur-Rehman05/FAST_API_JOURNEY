import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { ProductVariant } from '../../types/api';
import { apiClient } from '../../lib/api-client';

export const AdminInventory: React.FC = () => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const fetchInventory = async () => {
    try {
      const res = await apiClient.get<ProductVariant[]>('/inventory/');
      setVariants(res.data);
      const initialQty: Record<string, number> = {};
      res.data.forEach((v) => {
        initialQty[v.id] = v.stock_quantity;
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
      await apiClient.put(`/inventory/${variantId}`, {
        stock_quantity: quantities[variantId],
      });
      fetchInventory();
    } catch (err) {
      alert('Failed to update stock quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Inventory Stock Matrix</h1>
        <p className="text-slate-400 text-sm mt-1">View and update stock levels for all variant SKUs in real-time</p>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading inventory data...</div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-xs font-mono border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Variant SKU</th>
                  <th className="px-6 py-4">Price Modifier</th>
                  <th className="px-6 py-4">Stock Quantity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Quick Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {variants.map((v) => {
                  const currentQty = quantities[v.id] ?? v.stock_quantity;
                  const isLow = currentQty <= 5;
                  return (
                    <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-400">{v.sku}</td>
                      <td className="px-6 py-4 font-mono text-slate-300">+${Number(v.price_modifier).toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono">
                        <input
                          type="number"
                          value={currentQty}
                          onChange={(e) => setQuantities({ ...quantities, [v.id]: parseInt(e.target.value) || 0 })}
                          className="w-24 px-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                          isLow ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isLow ? 'LOW STOCK' : 'OK'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleUpdateStock(v.id)}
                          disabled={updatingId === v.id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center space-x-1.5 transition-all"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{updatingId === v.id ? 'Saving...' : 'Save Stock'}</span>
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
