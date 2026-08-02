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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#212121]">Category Manager</h1>
          <p className="text-xs text-[#757575] mt-0.5">Organize product categories and storefront navigation</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs font-bold flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-[#757575] text-xs py-12">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="ui-surface p-5 rounded-sm border border-gray-200 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xs bg-[#FFE8DE] text-[#F85606] font-bold text-xs flex items-center justify-center border border-[#F85606]/20">
                  #{c.id}
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-[#E7FFFD] text-[#0f766e] font-mono text-[10px] font-bold border border-[#b2f5f0]">
                  {c.slug}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#212121] pt-1">{c.name}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-sm space-y-4 shadow-xl border border-gray-200">
            <h2 className="text-base font-bold text-[#212121] border-b border-gray-200 pb-2">Add New Category</h2>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full p-2.5 border border-gray-300 rounded-xs text-xs text-[#212121] focus:outline-none focus:border-[#F85606]"
              />

              <input
                type="text"
                required
                placeholder="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-xs text-xs font-mono text-[#212121] focus:outline-none focus:border-[#F85606]"
              />

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 border border-gray-300 text-xs font-semibold text-[#757575] hover:bg-gray-100 rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs font-bold py-2 px-4"
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
