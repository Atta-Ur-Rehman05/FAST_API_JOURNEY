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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#212121]">Product Catalog Manager</h1>
          <p className="text-xs text-[#757575] mt-0.5">Create, edit, and inspect storefront items</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs font-bold flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-[#757575] text-xs py-12">Loading products...</div>
      ) : (
        <div className="ui-surface rounded-sm overflow-hidden shadow-xs border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121]">
              <thead className="bg-[#EFF0F5] text-[#757575] uppercase text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Base Price</th>
                  <th className="px-4 py-3">Variants</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#212121]">
                      {p.name}
                      <span className="block text-[11px] font-mono text-[#757575] font-normal">Slug: {p.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-[#757575]">{p.category?.name || `ID: ${p.category_id}`}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#F85606]">
                      Rs. {Number(p.base_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#0284C7] font-semibold">{p.variants?.length || 0} Variant(s)</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white p-6 rounded-sm space-y-4 shadow-xl border border-gray-200">
            <h2 className="text-base font-bold text-[#212121] border-b border-gray-200 pb-2">Add New Product</h2>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Product Name"
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

              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 rounded-xs text-xs text-[#212121] focus:outline-none focus:border-[#F85606]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                required
                placeholder="Base Price (Rs.)"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 rounded-xs text-xs font-mono text-[#212121] focus:outline-none focus:border-[#F85606]"
              />

              <textarea
                rows={3}
                placeholder="Product Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-xs text-xs text-[#212121] focus:outline-none focus:border-[#F85606]"
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
