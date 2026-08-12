import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ShoppingCart, Tag, Eye, ChevronRight, ChevronLeft, Heart, Sparkles } from 'lucide-react';
import type { Product, Category, PaginatedResponse } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';
import { ProductVisual } from '../components/product/ProductVisual';

const PAGE_SIZE = 24;
const MIN_PRICE = 0;
const MAX_PRICE = 2000;

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [savedProductIds, setSavedProductIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('saved_product_ids') || '[]'); } catch { return []; }
  });

  const [searchParams] = useSearchParams();
  const searchUrlTerm = searchParams.get('search') || '';
  const categoryUrlId = Number(searchParams.get('category_id'));
  const [searchTerm, setSearchTerm] = useState(searchUrlTerm);

  const { addItem } = useCartStore();

  const toggleSavedProduct = (productId: string) => {
    setSavedProductIds((current) => {
      const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
      localStorage.setItem('saved_product_ids', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    setSearchTerm(searchUrlTerm);
    setSelectedCategory(Number.isInteger(categoryUrlId) && categoryUrlId > 0 ? categoryUrlId : null);
    setPage(0);
  }, [searchUrlTerm, categoryUrlId]);

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

  const getProductPrice = (product: Product) => {
    const primaryVariant = product.variants?.[0];
    return Number(product.base_price) + (primaryVariant ? Number(primaryVariant.price_modifier) : 0);
  };

  const visibleProducts = products
    .filter((product) => {
      const hasStock = product.variants?.some((variant) => variant.available_quantity > 0) ?? false;
      return getProductPrice(product) <= maxPrice && (!inStockOnly || hasStock);
    })
    .sort((first, second) => {
      if (sortBy === 'price-low') return getProductPrice(first) - getProductPrice(second);
      if (sortBy === 'price-high') return getProductPrice(second) - getProductPrice(first);
      if (sortBy === 'newest') return new Date(second.created_at ?? 0).getTime() - new Date(first.created_at ?? 0).getTime();
      return 0;
    });

  const renderCategoryButton = (cat: Category, depth: number = 0): React.ReactNode => (
    <React.Fragment key={cat.id}>
      <button
        onClick={() => { setSelectedCategory(cat.id); setPage(0); }}
        className={`w-full text-left px-3 py-2 rounded-xs text-xs transition-colors flex items-center justify-between ${
          selectedCategory === cat.id
            ? 'bg-zinc-100 text-zinc-950 font-bold'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
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
    <div className="min-h-full bg-zinc-950">
      <section className="border-b border-zinc-800 bg-zinc-950 px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center lg:gap-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold tracking-[.16em] text-zinc-400">
              <Sparkles className="h-3 w-3" /> NEW SEASON COLLECTION 2026
            </span>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-zinc-50 sm:text-5xl">
              Elevate Your<br /><span className="text-zinc-500">Digital Experience</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-400">
              Discover studio-grade wireless audio, precision Retina workstations, and luxury crafted leather accessories.
            </p>
            <button
              onClick={() => { setSelectedCategory(null); setSearchTerm(''); setPage(0); }}
              className="btn-primary mt-7 text-sm"
            >
              Explore Store Catalog <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>

          <article className="mx-auto w-full max-w-sm rounded-[1.35rem] border border-zinc-800 bg-zinc-900/70 p-3 shadow-2xl shadow-black/30 ring-1 ring-zinc-800/70 lg:mx-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-amber-300">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85"
                alt="Black noise-cancelling headphones"
                className="h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-zinc-950">SPECIAL OFFER</span>
            </div>
            <div className="px-1 pb-2 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-100">★ 4.9 (128)</span>
                <span className="font-mono text-zinc-500">In Stock</span>
              </div>
              <h2 className="mt-1.5 text-base font-black text-zinc-50">Aura Studio Noise-Canceling</h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-black text-zinc-50">$349.99</span>
                <span className="text-xs text-zinc-500 line-through">$399.99</span>
              </div>
            </div>
          </article>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Page Header */}
      <div className="ui-surface p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-black text-zinc-100 uppercase tracking-tight flex items-center gap-1.5">
            <Tag className="w-5 h-5" />
            Product Catalog
          </h2>
          <span className="text-xs font-mono text-zinc-500 border-l border-zinc-800 pl-3 hidden sm:inline">
            {total} item{total === 1 ? '' : 's'}
          </span>
        </div>
        <button
          onClick={() => { setSelectedCategory(null); setSearchTerm(''); setPage(0); }}
          className="text-xs font-bold text-zinc-300 hover:text-white border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
        >
          <span>SHOP ALL PRODUCTS</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Catalog Layout: Sidebar Filters + Main Product Grid */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar Categories */}
        <aside className="w-full lg:w-60 ui-surface p-4 h-fit space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
            <Filter className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Collections</h3>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => { setSelectedCategory(null); setPage(0); }}
              className={`w-full text-left px-3 py-2 rounded-xs text-xs font-semibold transition-colors ${
                selectedCategory === null
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              All Categories
            </button>

            {categoryTree.map((cat) => renderCategoryButton(cat))}
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <label htmlFor="product-sort" className="block text-xs font-bold uppercase tracking-[.14em] text-zinc-400">Sort by</label>
            <select
              id="product-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-100 outline-none transition-colors focus:border-zinc-500"
            >
              <option value="featured">Featured first</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="newest">Newest first</option>
            </select>
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="price-range" className="text-xs font-bold uppercase tracking-[.14em] text-zinc-400">Price range</label>
              <span className="font-mono text-xs font-bold text-zinc-100">Rs. {maxPrice.toLocaleString()}</span>
            </div>
            <input
              id="price-range"
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step="50"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer accent-zinc-100"
            />
            <div className="flex justify-between font-mono text-[10px] text-zinc-500">
              <span>Rs. {MIN_PRICE}</span>
              <span>Rs. {MAX_PRICE.toLocaleString()}+</span>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 border-t border-zinc-800 pt-4 text-xs font-bold text-zinc-200">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 accent-zinc-100"
            />
            In-stock items only
          </label>
        </aside>

        {/* Product Grid Area */}
        <main className="flex-1 space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="h-72 ui-surface animate-pulse p-4 space-y-3">
                  <div className="h-40 bg-zinc-800 rounded-xl" />
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="ui-surface p-12 rounded-sm text-center space-y-3">
              <p className="text-base font-bold text-zinc-100">No matching products found</p>
              <p className="text-xs text-zinc-400">Try resetting your category or search keywords.</p>
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
                {visibleProducts.map((product) => {
                  const primaryVariant = product.variants?.[0];
                  const displayPrice = Number(product.base_price) + (primaryVariant ? Number(primaryVariant.price_modifier) : 0);
                  const hasStock = primaryVariant ? primaryVariant.available_quantity > 0 : false;
                  const isSaved = savedProductIds.includes(product.id);

                  return (
                    <div key={product.id} className="ui-card p-3 flex flex-col justify-between group relative"
                    >
                      <div>
                        {/* Product Image Container */}
                        <div className="w-full aspect-[4/5] bg-zinc-800 rounded-xl mb-3 overflow-hidden relative border border-zinc-800 flex items-center justify-center">
                          <ProductVisual product={product} className="transition-transform duration-300 group-hover:scale-105" />
                          {/* Stock Tag */}
                          <button onClick={() => toggleSavedProduct(product.id)} className={`absolute right-2 top-2 rounded-full bg-zinc-950/80 p-2 backdrop-blur-sm transition-colors ${isSaved ? 'text-rose-300' : 'text-zinc-300 hover:text-white'}`} aria-label={isSaved ? `Remove ${product.name} from saved products` : `Save ${product.name}`} aria-pressed={isSaved}><Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} /></button><span className={`absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                            hasStock ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50' : 'bg-rose-950/80 text-rose-300 border-rose-800/50'
                          }`}>
                            {hasStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-100 transition-colors line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                      </div>

                      {/* Pricing & Actions */}
                      <div className="mt-3 pt-2 border-t border-zinc-800 space-y-2">
                        <div>
                          <div className="font-mono text-base sm:text-lg font-black text-zinc-100 leading-none">
                            Rs. {displayPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <Link
                            to={`/products/${product.id}`}
                            className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-center"
                            aria-label={`View details for ${product.name}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {primaryVariant && (
                            <button
                              onClick={() => addItem(primaryVariant.id, 1)}
                              disabled={!hasStock}
                              className="flex-1 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
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
                    className="p-2 border border-zinc-800 rounded-md text-zinc-400 hover:border-zinc-600 hover:text-white disabled:opacity-40"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-zinc-500">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 border border-zinc-800 rounded-md text-zinc-400 hover:border-zinc-600 hover:text-white disabled:opacity-40"
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
    </div>
  );
};
