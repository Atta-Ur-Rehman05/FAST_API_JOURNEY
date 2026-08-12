import React, { useState, useEffect } from 'react';
import { Package, Warehouse, TrendingUp } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import type { InventoryItem, PaginatedResponse, Product } from '../../types/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ productsCount: 0, inventoryCount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prodRes, invRes] = await Promise.all([
          apiClient.get<PaginatedResponse<Product>>('/products/'),
          apiClient.get<PaginatedResponse<InventoryItem>>('/inventory/'),
        ]);
        setStats({
          productsCount: prodRes.data.total,
          inventoryCount: invRes.data.total,
        });
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2"><span className="rounded-full border border-zinc-800 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-500">OPS / LIVE</span><h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">Overview & Analytics</h1></div>
        <p className="text-xs text-zinc-500 mt-1">Catalog, inventory, and fulfillment telemetry.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="ui-surface p-5 space-y-2 ring-1 ring-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Products</span>
            <span className="rounded-md border border-emerald-800/50 bg-emerald-950/80 p-1.5 text-emerald-400"><Package className="w-4 h-4" /></span>
          </div>
          <div className="font-mono text-2xl font-black text-zinc-100">{stats.productsCount}</div>
        </div>

        <div className="ui-surface p-5 space-y-2 ring-1 ring-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Inventory Variants</span>
            <span className="rounded-md border border-emerald-800/50 bg-emerald-950/80 p-1.5 text-emerald-400"><Warehouse className="w-4 h-4" /></span>
          </div>
          <div className="font-mono text-2xl font-black text-zinc-100">{stats.inventoryCount}</div>
        </div>

        <div className="ui-surface p-5 space-y-2 ring-1 ring-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">System Health</span>
            <span className="rounded-md border border-emerald-800/50 bg-emerald-950/80 p-1.5 text-emerald-400"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="font-mono text-2xl font-black text-emerald-400">ONLINE</div>
        </div>
      </div>
    </div>
  );
};
