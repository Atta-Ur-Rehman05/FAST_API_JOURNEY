import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Tag, Eye } from 'lucide-react';
import type { Product, Category } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          apiClient.get<Product[]>('/products/'),
          apiClient.get<Category[]>('/categories/'),
        ]);
        setProducts(prodRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-500/20">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Explore Modern Catalog</h1>
          <p className="text-slate-400">Discover premium items with real-time stock and dynamic pricing.</p>
        </div>
        
        {/* Search Input */}
        <div className="w-full md:w-80 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search catalog..."
            className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 glass-panel p-6 rounded-2xl h-fit space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-700/50 pb-4">
            <Filter className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-200">Categories</h2>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              All Categories
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{cat.name}</span>
                <Tag className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 glass-card rounded-2xl animate-pulse bg-slate-800/40" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
              <p className="text-xl font-bold text-slate-300">No products found</p>
              <p className="text-sm text-slate-500">Try refining your search terms or category selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const primaryVariant = product.variants?.[0];
                const displayPrice = Number(product.base_price) + (primaryVariant ? Number(primaryVariant.price_modifier) : 0);
                const hasStock = primaryVariant ? primaryVariant.stock_quantity > 0 : false;

                return (
                  <div
                    key={product.id}
                    className="glass-card rounded-2xl p-5 flex flex-col justify-between group hover:-translate-y-1 transition-all"
                  >
                    <div>
                      {/* Product Image Preview */}
                      <div className="w-full h-48 bg-slate-900 rounded-xl mb-4 overflow-hidden relative border border-slate-800 flex items-center justify-center">
                        {product.images?.[0]?.image_url ? (
                          <img
                            src={product.images[0].image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-slate-600 font-mono text-xs">NO IMAGE AVAILABLE</div>
                        )}
                        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                          hasStock ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {hasStock ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                        {product.description || 'No description available for this item.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500 block uppercase font-mono">Price</span>
                        <span className="text-xl font-bold text-white font-mono">
                          ${displayPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <Link
                          to={`/products/${product.id}`}
                          className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {primaryVariant && (
                          <button
                            onClick={() => addItem(primaryVariant.id, 1)}
                            disabled={!hasStock}
                            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-40"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="text-xs">Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
