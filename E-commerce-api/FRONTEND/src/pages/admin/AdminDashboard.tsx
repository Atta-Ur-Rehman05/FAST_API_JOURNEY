import React, { useState, useEffect } from 'react';
import { Package, Warehouse, TrendingUp } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ productsCount: 0, inventoryCount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prodRes, invRes] = await Promise.all([
          apiClient.get('/products/'),
          apiClient.get('/inventory/'),
        ]);
        setStats({
          productsCount: prodRes.data.length,
          inventoryCount: invRes.data.length,
        });
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">System Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of catalog, stock metrics, and fulfillment</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</span>
            <Package className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{stats.productsCount}</div>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Variants</span>
            <Warehouse className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{stats.inventoryCount}</div>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Health</span>
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">ONLINE</div>
        </div>
      </div>
    </div>
  );
};
