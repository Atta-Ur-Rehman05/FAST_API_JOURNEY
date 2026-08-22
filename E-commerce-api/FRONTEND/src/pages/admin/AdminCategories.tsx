import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Category, PaginatedResponse } from '../../types/api';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { Modal } from '../../components/ui/Modal';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent_id: null as number | null,
  });

  const [search, setSearch] = useState('');
  const { confirm, dialog } = useConfirm();

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get<PaginatedResponse<Category>>('/categories/', {
        params: { search: search || undefined },
      });
      setCategories(res.data.items);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await apiClient.patch(`/categories/${editingId}`, formData);
      else await apiClient.post('/categories/', formData);
      setShowAddModal(false);
      setEditingId(null);
      fetchCategories();
      setFormData({ name: '', slug: '', parent_id: null });
      toast.success(editingId ? 'Category updated' : 'Category created');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save category.');
    }
  };

  const startEdit = (category: Category) => {
    setFormData({ name: category.name, slug: category.slug, parent_id: category.parent_id || null });
    setEditingId(category.id);
    setShowAddModal(true);
  };

  const deleteCategory = async (id: number) => {
    const ok = await confirm({
      title: 'Delete category',
      message: 'Are you sure? Categories with products or children cannot be deleted.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try { await apiClient.delete(`/categories/${id}`); fetchCategories(); toast.success('Category deleted'); }
    catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to delete category.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Category Manager</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Organize product categories and storefront navigation</p>
        </div>
        <button
          onClick={() => { setFormData({ name: '', slug: '', parent_id: null }); setEditingId(null); setShowAddModal(true); }}
          className="btn-primary text-xs font-bold flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search categories by name or slug"
        className="w-full sm:w-80 p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
      />

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="ui-surface p-5 rounded-sm border border-zinc-700 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xs bg-zinc-800 text-zinc-100 font-bold text-xs flex items-center justify-center border border-zinc-700/20">
                  #{c.id}
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-zinc-900 text-zinc-200 font-mono text-[10px] font-bold border border-zinc-700">
                  {c.slug}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100 pt-1">{c.name}</h3>
              <p className="text-[11px] text-zinc-400">{c.parent_id ? `Parent category: #${c.parent_id}` : 'Top-level category'}</p>
              <div className="flex gap-2 pt-2">
                <button onClick={() => startEdit(c)} className="text-xs text-zinc-100 font-bold flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => deleteCategory(c.id)} className="text-xs text-rose-600 font-bold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setEditingId(null); }} title={editingId ? 'Edit Category' : 'Add New Category'} maxWidth="max-w-md">
        <form onSubmit={handleSaveCategory} className="space-y-3">
          <input
            type="text"
            required
            placeholder="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
          />

          <select value={formData.parent_id ?? ''} onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : null })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700">
            <option value="">No parent (top-level category)</option>
            {categories.filter((category) => category.id !== editingId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>

          <input
            type="text"
            required
            placeholder="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
          />

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-700">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); setEditingId(null); }}
              className="px-3 py-2 border border-zinc-700 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs font-bold py-2 px-4"
            >
              {editingId ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
      {dialog}
    </div>
  );
};