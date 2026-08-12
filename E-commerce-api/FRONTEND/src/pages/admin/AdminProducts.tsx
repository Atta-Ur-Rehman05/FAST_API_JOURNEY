import React, { useState, useEffect } from 'react';
import { ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Product, Category, PaginatedResponse } from '../../types/api';
import { apiClient } from '../../lib/api-client';

type VariantDraft = {
  id?: string;
  sku: string;
  price_modifier: number;
  stock_quantity: number;
  attributes: string;
};

type ImageDraft = {
  id?: number;
  image_url: string;
  is_primary: boolean;
};

const emptyVariant = (): VariantDraft => ({
  sku: '',
  price_modifier: 0,
  stock_quantity: 0,
  attributes: '',
});

const emptyImage = (): ImageDraft => ({ image_url: '', is_primary: false });

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
        apiClient.get<PaginatedResponse<Product>>('/products/'),
        apiClient.get<PaginatedResponse<Category>>('/categories/'),
      ]);
      setProducts(prodRes.data.items);
      setCategories(catRes.data.items);
      if (catRes.data.items.length > 0) setFormData(f => ({ ...f, category_id: catRes.data.items[0].id }));
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
    let variantPayload: Array<Omit<VariantDraft, 'attributes'> & { attributes?: Record<string, unknown> }>;
    try {
      variantPayload = variants.map((variant) => ({
        sku: variant.sku.trim(),
        price_modifier: variant.price_modifier,
        stock_quantity: variant.stock_quantity,
        ...(variant.attributes.trim() ? { attributes: JSON.parse(variant.attributes) as Record<string, unknown> } : {}),
      }));
    } catch {
      alert('Variant attributes must be valid JSON, for example {"color":"Blue"}.');
      return;
    }

    if (variantPayload.some((variant) => !variant.sku)) {
      alert('Every variant needs an SKU.');
      return;
    }

    if (images.some((image) => !image.image_url.trim())) {
      alert('Every image needs a URL.');
      return;
    }

    setIsCreating(true);
    try {
      const productId = editingProduct
        ? (await apiClient.patch<Product>(`/products/${editingProduct.id}`, formData)).data.id
        : (await apiClient.post<Product>('/products/', formData)).data.id;

      await Promise.all([
        ...variantPayload.map((variant, index) => variants[index].id
          ? apiClient.patch(`/products/${productId}/variants/${variants[index].id}`, variant)
          : apiClient.post(`/products/${productId}/variants`, variant)),
        ...images.map((image) => images.findIndex((candidate) => candidate === image) >= 0 && image.id
          ? apiClient.patch(`/products/${productId}/images/${image.id}`, {
              image_url: image.image_url.trim(), is_primary: image.is_primary,
            })
          : apiClient.post(`/products/${productId}/images`, {
          image_url: image.image_url.trim(),
          is_primary: image.is_primary,
          })),
      ]);
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
      setVariants([]);
      setImages([]);
      setEditingProduct(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create product.');
    } finally {
      setIsCreating(false);
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, slug: product.slug, description: product.description || '', base_price: Number(product.base_price), category_id: product.category_id, is_active: product.is_active });
    setVariants(product.variants.map((variant) => ({ id: variant.id, sku: variant.sku, price_modifier: Number(variant.price_modifier), stock_quantity: variant.stock_quantity, attributes: variant.attributes ? JSON.stringify(variant.attributes) : '' })));
    setImages(product.images.map((image) => ({ id: image.id, image_url: image.image_url, is_primary: image.is_primary })));
    setShowAddModal(true);
  };

  const removeVariant = async (index: number) => {
    const variant = variants[index];
    if (editingProduct && variant.id) await apiClient.delete(`/products/${editingProduct.id}/variants/${variant.id}`);
    setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const removeImage = async (index: number) => {
    const image = images[index];
    if (editingProduct && image.id) await apiClient.delete(`/products/${editingProduct.id}/images/${image.id}`);
    setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateVariant = (index: number, updates: Partial<VariantDraft>) => {
    setVariants((current) => current.map((variant, itemIndex) => (
      itemIndex === index ? { ...variant, ...updates } : variant
    )));
  };

  const updateImage = (index: number, updates: Partial<ImageDraft>) => {
    setImages((current) => current.map((image, itemIndex) => ({
      ...image,
      ...updates,
      is_primary: updates.is_primary ? itemIndex === index : image.is_primary,
    })));
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      fetchData();
    } catch {
      alert('Failed to delete product.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">Inventory & Catalog</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Create, edit, and inspect storefront items</p>
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
        <div className="text-center text-zinc-400 text-xs py-12">Loading products...</div>
      ) : (
        <div className="ui-surface rounded-sm overflow-hidden shadow-xs border border-zinc-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-100">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[11px] font-bold border-b border-zinc-700">
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
                  <tr key={p.id} className="hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3 font-bold text-zinc-100">
                      {p.name}
                      <span className="block text-[11px] font-mono text-zinc-400 font-normal">Slug: {p.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{p.category?.name || `ID: ${p.category_id}`}</td>
                    <td className="px-4 py-3 font-mono font-bold text-zinc-100">
                      Rs. {Number(p.base_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-100 font-semibold">{p.variants?.length || 0} Variant(s)</td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEditProduct(p)} className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors" title="Edit product"><Pencil className="w-4 h-4" /></button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors"
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
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 p-6 rounded-xl space-y-4 border border-zinc-800 ring-1 ring-zinc-800/80">
            <h2 className="text-base font-black text-zinc-100 border-b border-zinc-800 pb-3">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full p-2.5 border text-xs"
              />

              <input
                type="text"
                required
                placeholder="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full p-2.5 border text-xs font-mono"
              />

              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                className="w-full p-2.5 border text-xs"
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
                className="w-full p-2.5 border text-xs font-mono"
              />

              <textarea
                rows={3}
                placeholder="Product Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 border text-xs"
              />

              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} /> Product is active in the storefront</label>

              <section className="space-y-3 border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Variants</h3>
                    <p className="text-[11px] text-zinc-500">Optional. Add each purchasable SKU and its stock.</p>
                  </div>
                  <button type="button" onClick={() => setVariants((current) => [...current, emptyVariant()])} className="text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Variant
                  </button>
                </div>

                {variants.map((variant, index) => (
                  <div key={index} className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 pr-9">
                    <input type="text" required placeholder="SKU" value={variant.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} className="w-full p-2 border text-xs font-mono" />
                    <input type="number" step="0.01" placeholder="Price modifier" value={variant.price_modifier} onChange={(e) => updateVariant(index, { price_modifier: Number(e.target.value) || 0 })} className="w-full p-2 border text-xs font-mono" />
                    <input type="number" min="0" placeholder="Stock quantity" value={variant.stock_quantity} onChange={(e) => updateVariant(index, { stock_quantity: Math.max(0, Number(e.target.value) || 0) })} className="w-full p-2 border text-xs font-mono" />
                    <input type="text" placeholder={'Attributes JSON, e.g. {"color":"Blue"}'} value={variant.attributes} onChange={(e) => updateVariant(index, { attributes: e.target.value })} className="sm:col-span-3 w-full p-2 border text-xs font-mono" />
                    <button type="button" onClick={() => removeVariant(index)} className="absolute right-2 top-2 text-zinc-400 hover:text-rose-600" aria-label="Remove variant"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </section>

              <section className="space-y-3 border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Product Images</h3>
                    <p className="text-[11px] text-zinc-500">Optional. The API accepts image URLs.</p>
                  </div>
                  <button type="button" onClick={() => setImages((current) => [...current, emptyImage()])} className="text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1">
                    <ImagePlus className="w-3.5 h-3.5" /> Add Image
                  </button>
                </div>

                {images.map((image, index) => (
                  <div key={index} className="relative flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 pr-9">
                    <input type="url" required placeholder="https://example.com/product-image.jpg" value={image.image_url} onChange={(e) => updateImage(index, { image_url: e.target.value })} className="min-w-0 flex-1 p-2 border text-xs" />
                    <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-zinc-300"><input type="radio" name="primary-image" checked={image.is_primary} onChange={() => updateImage(index, { is_primary: true })} /> Primary</label>
                    <button type="button" onClick={() => removeImage(index)} className="absolute right-2 top-3 text-zinc-400 hover:text-rose-600" aria-label="Remove image"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </section>

              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingProduct(null); setVariants([]); setImages([]); }}
                  className="px-3 py-2 border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-primary text-xs font-bold py-2 px-4"
                >
                  {isCreating ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
