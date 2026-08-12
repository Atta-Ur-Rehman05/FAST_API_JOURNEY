import React, { useState, useEffect } from 'react';
import { Minus, Plus, Save } from 'lucide-react';
import type { InventoryItem, PaginatedResponse } from '../../types/api';
import { apiClient } from '../../lib/api-client';

export const AdminInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<InventoryItem | null>(null);
  const [lookupError, setLookupError] = useState('');

  const lookupInventory = async () => {
    const query = lookupQuery.trim();
    if (!query) return;
    setLookupError('');
    setLookupResult(null);
    try {
      let res;
      if (query.includes('-')) {
        res = await apiClient.get<InventoryItem>(`/inventory/${query}`);
      } else {
        res = await apiClient.get<InventoryItem>(`/inventory/sku/${encodeURIComponent(query)}`);
      }
      setLookupResult(res.data);
    } catch (err: any) {
      setLookupError(err.response?.data?.detail || 'No inventory record found for that SKU or variant ID.');
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await apiClient.get<PaginatedResponse<InventoryItem>>('/inventory/', { params: {
        search: search || undefined,
        low_stock_only: stockFilter === 'low' || undefined,
        out_of_stock_only: stockFilter === 'out' || undefined,
      } });
      setInventory(res.data.items);
      const initialQty: Record<string, number> = {};
      res.data.items.forEach((item) => {
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
  }, [search, stockFilter]);

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

  const adjustStock = async (variantId: string, action: 'restock' | 'deduct' | 'release') => {
    const quantity = adjustments[variantId] || 0;
    if (quantity <= 0) { alert('Enter an adjustment quantity greater than zero.'); return; }
    setUpdatingId(variantId);
    try {
      await apiClient.post(`/inventory/${variantId}/${action}`, { quantity, reason: `Admin ${action}` });
      fetchInventory();
    } catch (err: any) { alert(err.response?.data?.detail || `Failed to ${action} stock.`); }
    finally { setUpdatingId(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Inventory Stock Matrix</h1>
        <p className="text-xs text-zinc-400 mt-0.5">View and update stock levels for all variant SKUs</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or SKU" className="flex-1 p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')} className="p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700">
          <option value="all">All stock</option><option value="low">Low stock only</option><option value="out">Out of stock only</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={lookupQuery}
          onChange={(e) => setLookupQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') lookupInventory(); }}
          placeholder="Lookup by SKU or variant ID (UUID)"
          className="flex-1 p-2.5 border border-zinc-700 rounded-xs text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
        />
        <button onClick={lookupInventory} className="btn-primary text-xs font-bold py-2 px-4">Lookup</button>
      </div>

      {lookupError && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xs p-3">{lookupError}</p>}

      {lookupResult && (
        <div className="ui-surface p-4 rounded-sm border border-zinc-700/40 shadow-xs flex flex-wrap items-center gap-4 text-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400">Product</p>
            <p className="font-bold text-zinc-100">{lookupResult.product_name || 'Unnamed product'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400">SKU</p>
            <p className="font-mono font-bold text-zinc-100">{lookupResult.sku}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400">Physical / Reserved / Available</p>
            <p className="font-mono text-zinc-100">{lookupResult.stock_quantity} / {lookupResult.reserved_quantity} / {lookupResult.available_quantity}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400">Status</p>
            <p className={`font-bold ${lookupResult.is_out_of_stock ? 'text-rose-700' : lookupResult.is_low_stock ? 'text-amber-700' : 'text-emerald-700'}`}>
              {lookupResult.is_out_of_stock ? 'OUT OF STOCK' : lookupResult.is_low_stock ? 'LOW STOCK' : 'IN STOCK'}
            </p>
          </div>
          <button onClick={() => { setLookupResult(null); setLookupQuery(''); }} className="ml-auto text-zinc-400 text-xs hover:text-rose-600">Clear</button>
        </div>
      )}

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading inventory matrix...</div>
      ) : (
        <div className="ui-surface rounded-sm overflow-hidden border border-zinc-700 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-100">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[11px] font-bold border-b border-zinc-700">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Variant SKU</th>
                  <th className="px-4 py-3">Physical / Reserved / Available</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Quick Update</th>
                  <th className="px-4 py-3">Adjust Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map((item) => {
                  const currentQty = quantities[item.variant_id] ?? item.stock_quantity;
                  const availableQty = currentQty - item.reserved_quantity;
                  const isOutOfStock = availableQty === 0;
                  const isLow = availableQty > 0 && availableQty <= item.low_stock_threshold;
                  return (
                    <tr key={item.variant_id} className="hover:bg-zinc-900 transition-colors">
                      <td className="px-4 py-3 text-zinc-100">{item.product_name || 'Unnamed product'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-100">{item.sku}</td>
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={item.reserved_quantity}
                            value={currentQty}
                            onChange={(e) => setQuantities({ ...quantities, [item.variant_id]: Math.max(item.reserved_quantity, Number(e.target.value) || 0) })}
                            className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-xs text-zinc-100 font-mono text-xs focus:outline-none focus:border-zinc-700"
                          />
                          <span className="text-zinc-400">/ {item.reserved_quantity} / {availableQty}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                          (isOutOfStock || isLow) ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isOutOfStock ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <input type="number" min="1" value={adjustments[item.variant_id] ?? ''} onChange={(e) => setAdjustments({ ...adjustments, [item.variant_id]: Number(e.target.value) || 0 })} placeholder="Qty" className="w-16 px-2 py-1 border border-zinc-700 rounded-xs text-xs font-mono" />
                          <button onClick={() => adjustStock(item.variant_id, 'restock')} disabled={updatingId === item.variant_id} title="Restock" className="p-1 text-emerald-700 hover:bg-emerald-50"><Plus className="w-4 h-4" /></button>
                          <button onClick={() => adjustStock(item.variant_id, 'deduct')} disabled={updatingId === item.variant_id} title="Deduct" className="p-1 text-rose-700 hover:bg-rose-50"><Minus className="w-4 h-4" /></button>
                          <button onClick={() => adjustStock(item.variant_id, 'release')} disabled={updatingId === item.variant_id} title="Release reserved stock" className="px-1.5 py-1 text-[10px] font-bold text-zinc-100 hover:bg-zinc-900">Release</button>
                        </div>
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
