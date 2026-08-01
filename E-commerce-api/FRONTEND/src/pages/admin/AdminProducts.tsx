import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Product, Category } from '../../types/api';
import { apiClient } from '../../lib/api-client';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    base_price: 99.99,
    category_id: 1,
    is_active: true,
  });

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        apiClient.get<Product[]>('/products/'),
        apiClient.get<Category[]>('/categories/'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0) setFormData(f => ({ ...f, category_id: catRes.data[0].id }));
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/products/', formData);
      setShowAddModal(false);
      fetchData();
      setFormData({
        name: '',
        slug: '',
        description: '',
        base_price: 99.99,
        category_id: categories[0]?.id || 1,
        is_active: true,
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Product Catalog Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Create, edit, and inspect store items and variants</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading products...</div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-xs font-mono border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Base Price</th>
                  <th className="px-6 py-4">Variants</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">
                      {p.name}
                      <span className="block text-xs font-mono text-slate-500 font-normal">Slug: {p.slug}</span>
                    </td>
                    <td className="px-6 py-4">{p.category?.name || `ID: ${p.category_id}`}</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">${Number(p.base_price).toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-indigo-400">{p.variants?.length || 0} Variant(s)</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold text-white">Add New Product</h2>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Product Name"
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

              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                required
                placeholder="Base Price ($)"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono"
              />

              <textarea
                rows={3}
                placeholder="Product Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500"
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
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
