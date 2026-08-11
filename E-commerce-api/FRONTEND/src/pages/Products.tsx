import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ShoppingCart, Tag, Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Product, Category, PaginatedResponse } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';

const PAGE_SIZE = 24;

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [searchParams] = useSearchParams();
  const searchUrlTerm = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(searchUrlTerm);

  const { addItem } = useCartStore();

  useEffect(() => {
    setSearchTerm(searchUrlTerm);
    setPage(0);
  }, [searchUrlTerm]);

  // Fetch category tree from the backend (supports nested subcategories)
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await apiClient.get<PaginatedResponse<Category>>('/categories/tree', {
          params: { limit: 100 },
        });
        setCategoryTree(res.data.items);
      } catch (err) {
        console.error('Error fetching category tree:', err);
      }
    };
    fetchTree();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<Product>>('/products/', {
        params: {
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
          search: searchTerm || undefined,
          category_id: selectedCategory ?? undefined,
          is_active: true,
        },
      });
      setProducts(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const renderCategoryButton = (cat: Category, depth: number = 0): React.ReactNode => (
    <React.Fragment key={cat.id}>
      <button
        onClick={() => { setSelectedCategory(cat.id); setPage(0); }}
        className={`w-full text-left px-3 py-2 rounded-xs text-xs transition-colors flex items-center justify-between ${
          selectedCategory === cat.id
            ? 'bg-[#F85606] text-white font-bold'
            : 'text-gray-700 hover:bg-[#EFF0F5] hover:text-[#F85606]'
        }`}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        <span className="truncate pr-2">{cat.name}</span>
        {depth > 0 && <ChevronRight className="w-3 h-3 opacity-60" />}
      </button>
      {(cat.children ?? cat.subcategories)?.map((child) => renderCategoryButton(child, depth + 1))}
    </React.Fragment>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Page Header */}
      <div className="ui-surface p-4 rounded-sm flex items-center justify-between border-l-4 border-l-[#F85606]">
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-bold text-[#F85606] uppercase tracking-wide flex items-center gap-1.5">
            <Tag className="w-5 h-5 fill-[#F85606]" />
            Product Catalog
          </h1>
          <span className="text-xs text-[#757575] border-l border-gray-300 pl-3 hidden sm:inline">
            {total} item{total === 1 ? '' : 's'}
          </span>
        </div>
        <button
          onClick={() => { setSelectedCategory(null); setSearchTerm(''); setPage(0); }}
          className="text-xs font-bold text-[#F85606] hover:text-[#D04400] border border-[#F85606] hover:bg-[#FFE8DE] px-3 py-1.5 rounded-xs transition-colors flex items-center gap-1"
        >
          <span>SHOP ALL PRODUCTS</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Catalog Layout: Sidebar Filters + Main Product Grid */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar Categories */}
        <aside className="w-full lg:w-60 ui-surface p-4 rounded-sm h-fit space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
            <Filter className="w-4 h-4 text-[#F85606]" />
            <h3 className="text-sm font-bold text-[#212121] uppercase tracking-wider">Categories</h3>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => { setSelectedCategory(null); setPage(0); }}
              className={`w-full text-left px-3 py-2 rounded-xs text-xs font-semibold transition-colors ${
                selectedCategory === null
                  ? 'bg-[#F85606] text-white font-bold'
                  : 'text-gray-700 hover:bg-[#EFF0F5] hover:text-[#F85606]'
              }`}
            >
              All Categories
            </button>

            {categoryTree.map((cat) => renderCategoryButton(cat))}
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="flex-1 space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="h-72 ui-surface rounded-sm animate-pulse bg-gray-100 p-4 space-y-3">
                  <div className="h-40 bg-gray-200 rounded-xs" />
                  <div className="h-4 bg-gray-200 rounded-xs w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-xs w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="ui-surface p-12 rounded-sm text-center space-y-3">
              <p className="text-base font-bold text-[#212121]">No matching products found</p>
              <p className="text-xs text-[#757575]">Try resetting your category or search keywords.</p>
              <button
                onClick={() => { setSelectedCategory(null); setSearchTerm(''); setPage(0); }}
                className="btn-primary text-xs"
              >
                Clear Search Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => {
                  const primaryVariant = product.variants?.[0];
                  const displayPrice = Number(product.base_price) + (primaryVariant ? Number(primaryVariant.price_modifier) : 0);
                  const hasStock = primaryVariant ? primaryVariant.available_quantity > 0 : false;

                  return (
                    <div
                      key={product.id}
                      className="ui-card rounded-sm p-3 flex flex-col justify-between group bg-white hover:border-[#F85606] transition-all relative"
                    >
                      <div>
                        {/* Product Image Container */}
                        <div className="w-full h-44 bg-white rounded-xs mb-2 overflow-hidden relative border border-gray-100 flex items-center justify-center group-hover:opacity-95">
                          {product.images?.[0]?.image_url ? (
                            <img
                              src={product.images[0].image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="text-gray-400 font-mono text-[10px]">NO IMAGE</div>
                          )}
                          {/* Stock Tag */}
                          <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            hasStock ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {hasStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-xs sm:text-sm font-medium text-[#212121] group-hover:text-[#F85606] transition-colors line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                      </div>

                      {/* Pricing & Actions */}
                      <div className="mt-3 pt-2 border-t border-gray-100 space-y-2">
                        <div>
                          <div className="text-base sm:text-lg font-extrabold text-[#F85606] leading-none">
                            Rs. {displayPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <Link
                            to={`/products/${product.id}`}
                            className="p-1.5 rounded-xs border border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-[#F85606] transition-colors flex items-center justify-center"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {primaryVariant && (
                            <button
                              onClick={() => addItem(primaryVariant.id, 1)}
                              disabled={!hasStock}
                              className="flex-1 py-1.5 px-2 bg-[#F85606] hover:bg-[#D04400] text-white text-xs font-semibold rounded-xs flex items-center justify-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Server-side Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 border border-gray-300 rounded-xs text-[#757575] hover:border-[#F85606] hover:text-[#F85606] disabled:opacity-40"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-[#757575]">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 border border-gray-300 rounded-xs text-[#757575] hover:border-[#F85606] hover:text-[#F85606] disabled:opacity-40"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

    </div>
  );
};
