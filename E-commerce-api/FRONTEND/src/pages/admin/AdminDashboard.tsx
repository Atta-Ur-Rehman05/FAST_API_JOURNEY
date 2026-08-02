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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#212121]">System Dashboard</h1>
        <p className="text-xs text-[#757575] mt-0.5">Overview of catalog items, inventory status, and fulfillment queue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="ui-surface p-5 rounded-sm space-y-2 shadow-xs border-l-4 border-l-[#F85606]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#757575] uppercase tracking-wider">Total Products</span>
            <Package className="w-5 h-5 text-[#F85606]" />
          </div>
          <div className="text-2xl font-black text-[#212121]">{stats.productsCount}</div>
        </div>

        <div className="ui-surface p-5 rounded-sm space-y-2 shadow-xs border-l-4 border-l-[#0284C7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#757575] uppercase tracking-wider">Inventory Variants</span>
            <Warehouse className="w-5 h-5 text-[#0284C7]" />
          </div>
          <div className="text-2xl font-black text-[#212121]">{stats.inventoryCount}</div>
        </div>

        <div className="ui-surface p-5 rounded-sm space-y-2 shadow-xs border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#757575] uppercase tracking-wider">System Health</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">ONLINE</div>
        </div>
      </div>
    </div>
  );
};
