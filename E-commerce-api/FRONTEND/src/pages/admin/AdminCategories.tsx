import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { Category } from '../../types/api';
import { apiClient } from '../../lib/api-client';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  });

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get<Category[]>('/categories/');
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/categories/', formData);
      setShowAddModal(false);
      fetchCategories();
      setFormData({ name: '', slug: '' });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create category.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Category Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Organize storefront product categories and subcategories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <div key={c.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                  #{c.id}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono text-xs">
                  {c.slug}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{c.name}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold text-white">Add New Category</h2>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500"
              />

              <input
                type="text"
                required
                placeholder="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 font-mono"
              />

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
