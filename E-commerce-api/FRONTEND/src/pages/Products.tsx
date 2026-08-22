import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ShoppingCart, Tag, Eye, ChevronRight, ChevronLeft, Heart, ArrowRight } from 'lucide-react';
import type { Product, CategoryTreeResponse, PaginatedResponse } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { usePublicContent } from '../hooks/usePublicContent';
import { ProductVisual } from '../components/product/ProductVisual';

const PAGE_SIZE = 24;
const MIN_PRICE = 0;
const MAX_PRICE = 2000;

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [searchParams] = useSearchParams();
  const searchUrlTerm = searchParams.get('search') || '';
  const categoryUrlId = Number(searchParams.get('category_id'));
  const [searchTerm, setSearchTerm] = useState(searchUrlTerm);

  const { slides, blogs, loading: publicLoading } = usePublicContent();
  const activeSlides = slides.filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const publishedBlogs = blogs.slice(0, 3);

  const { addItem } = useCartStore();
  const { wishlist, addItem: addWishlistItem, removeItem: removeWishlistItem } = useWishlistStore();

  const toggleSavedProduct = async (productId: string) => {
    const isSaved = wishlist?.items?.some((item) => item.product_id === productId);
    if (isSaved) {
      await removeWishlistItem(productId);
    } else {
      await addWishlistItem(productId);
    }
  };

  useEffect(() => {
    useWishlistStore.getState().fetchWishlist();
  }, []);

  useEffect(() => {
    setSearchTerm(searchUrlTerm);
    setSelectedCategory(Number.isInteger(categoryUrlId) && categoryUrlId > 0 ? categoryUrlId : null);
    setPage(0);
  }, [searchUrlTerm, categoryUrlId]);

  // Fetch category tree from the backend (supports nested subcategories)
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await apiClient.get<PaginatedResponse<CategoryTreeResponse>>('/categories/tree', {
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
      const sortByMap: Record<SortOption, { sort_by: string; order: string }> = {
        'featured': { sort_by: 'created_at', order: 'desc' },
        'price-low': { sort_by: 'base_price', order: 'asc' },
        'price-high': { sort_by: 'base_price', order: 'desc' },
        'newest': { sort_by: 'created_at', order: 'desc' },
      };
      const sort = sortByMap[sortBy];
      const res = await apiClient.get<PaginatedResponse<Product>>('/products/', {
        params: {
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
          search: searchTerm || undefined,
          category_id: selectedCategory ?? undefined,
          is_active: true,
          sort_by: sort.sort_by,
          order: sort.order,
          max_price: maxPrice < MAX_PRICE ? maxPrice : undefined,
          in_stock: inStockOnly,
        },
      });
      setProducts(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCategory, sortBy, maxPrice, inStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const renderCategoryButton = (cat: CategoryTreeResponse, depth: number = 0): React.ReactNode => (
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
      {(cat.children)?.map((child) => renderCategoryButton(child, depth + 1))}
    </React.Fragment>
  );

  return (
    <div className="min-h-full bg-zinc-950">
      {!publicLoading && activeSlides.length > 0 && (
        <section className="relative border-b border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="relative aspect-[16/5] sm:aspect-[16/4] lg:aspect-[16/3] w-full">
            {activeSlides.map((slide, index) => (
              <Link
                key={slide.id}
                to={slide.link_url || '/products'}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/40 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-xl">
                      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-50 leading-[1.1]">
                        {slide.title}
                      </h2>
                      {slide.subtitle && (
                        <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
                          {slide.subtitle}
                        </p>
                      )}
                      <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-zinc-100 hover:text-white">
                        Shop Now <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {activeSlides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${index === currentSlide ? 'w-6 bg-zinc-100' : 'w-1.5 bg-zinc-500 hover:bg-zinc-300'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}
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
          ) : products.length === 0 ? (
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
                {products.map((product) => {
                  const primaryVariant = product.variants?.[0];
                  const displayPrice = Number(product.base_price) + (primaryVariant ? Number(primaryVariant.price_modifier) : 0);
                  const hasStock = primaryVariant ? primaryVariant.available_quantity > 0 : false;
                  const isSaved = wishlist?.items?.some((item) => item.product_id === product.id) || false;

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

      {/* Blog Section */}
      {!publicLoading && publishedBlogs.length > 0 && (
        <section className="border-t border-zinc-800 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-zinc-100 uppercase tracking-tight">From the Blog</h2>
              <Link to="/blogs" className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedBlogs.map((blog) => (
                <Link key={blog.id} to={`/blogs/${blog.slug}`} className="ui-card p-4 flex flex-col gap-3 group">
                  {blog.cover_image_url && (
                    <div className="aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                      <img src={blog.cover_image_url} alt={blog.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 line-clamp-2 group-hover:text-white transition-colors">{blog.title}</h3>
                    <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2">{blog.excerpt}</p>
                    {blog.author_name && <p className="mt-2 text-[10px] font-mono text-zinc-500">By {blog.author_name}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      </div>
    </div>
  );
};
