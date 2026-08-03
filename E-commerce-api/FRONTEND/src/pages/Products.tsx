import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ShoppingCart, Tag, Eye, Zap, ShieldCheck, ChevronRight } from 'lucide-react';
import type { Product, Category } from '../types/api';
import { apiClient } from '../lib/api-client';
import { useCartStore } from '../store/cartStore';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const [searchParams] = useSearchParams();
  const searchUrlTerm = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(searchUrlTerm);

  const { addItem } = useCartStore();

  useEffect(() => {
    setSearchTerm(searchUrlTerm);
  }, [searchUrlTerm]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. Promotional Flash Banner (ZetaMall High-Contrast Hero Banner) */}
      <div className="bg-gradient-to-r from-[#F85606] via-[#FF6A1A] to-[#D04400] text-white rounded-sm p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-[#E7FFFD]/40 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#E7FFFD] text-[#0f766e] text-xs font-extrabold px-2.5 py-1 rounded-xs uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-[#F85606] text-[#F85606]" />
            <span>BEST PRICE GUARANTEED</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Flash Sale & Guaranteed Discounts
          </h1>
          <p className="text-white/90 text-sm max-w-xl">
            Get the best deals online with fast shipping, exclusive vouchers, and 100% genuine products.
          </p>
        </div>

        <div className="hidden lg:flex items-center space-x-4 z-10">
          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xs border border-white/20 text-center space-y-1">
            <ShieldCheck className="w-8 h-8 text-[#E7FFFD] mx-auto" />
            <p className="text-xs font-bold text-white">Free Shipping</p>
            <p className="text-[10px] text-white/80">On select orders</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xs border border-white/20 text-center space-y-1">
            <Tag className="w-8 h-8 text-[#E7FFFD] mx-auto" />
            <p className="text-xs font-bold text-white">Exclusive Vouchers</p>
            <p className="text-[10px] text-white/80">Extra 15% Off</p>
          </div>
        </div>
      </div>

      {/* 2. Flash Sale Section Strip */}
      <div className="ui-surface p-4 rounded-sm flex items-center justify-between border-l-4 border-l-[#F85606]">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-[#F85606] uppercase tracking-wide flex items-center gap-1.5">
            <Zap className="w-5 h-5 fill-[#F85606]" />
            Flash Sale
          </h2>
          <span className="text-xs text-[#757575] border-l border-gray-300 pl-3 hidden sm:inline">
            On Sale Now
          </span>
        </div>
        <button
          onClick={() => setSelectedCategory(null)}
          className="text-xs font-bold text-[#F85606] hover:text-[#D04400] border border-[#F85606] hover:bg-[#FFE8DE] px-3 py-1.5 rounded-xs transition-colors flex items-center gap-1"
        >
          <span>SHOP ALL PRODUCTS</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Catalog Layout: Sidebar Filters + Main Product Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Categories */}
        <aside className="w-full lg:w-60 ui-surface p-4 rounded-sm h-fit space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
            <Filter className="w-4 h-4 text-[#F85606]" />
            <h3 className="text-sm font-bold text-[#212121] uppercase tracking-wider">Categories</h3>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-xs text-xs font-semibold transition-colors flex items-center justify-between ${
                selectedCategory === null
                  ? 'bg-[#F85606] text-white font-bold'
                  : 'text-gray-700 hover:bg-[#EFF0F5] hover:text-[#F85606]'
              }`}
            >
              <span>All Categories</span>
              <span className="text-[10px] opacity-80">({products.length})</span>
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-xs text-xs transition-colors flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-[#F85606] text-white font-bold'
                      : 'text-gray-700 hover:bg-[#EFF0F5] hover:text-[#F85606]'
                  }`}
                >
                  <span className="truncate pr-2">{cat.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="flex-1">
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
          ) : filteredProducts.length === 0 ? (
            <div className="ui-surface p-12 rounded-sm text-center space-y-3">
              <p className="text-base font-bold text-[#212121]">No matching products found</p>
              <p className="text-xs text-[#757575]">Try resetting your category or search keywords.</p>
              <button
                onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
                className="btn-primary text-xs"
              >
                Clear Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const primaryVariant = product.variants?.[0];
                const displayPrice = Number(product.base_price) + (primaryVariant ? Number(primaryVariant.price_modifier) : 0);
                const strikePrice = displayPrice * 1.35; // Simulated original price for Daraz high-contrast discount display
                const hasStock = primaryVariant ? primaryVariant.stock_quantity > 0 : false;

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
                        
                        {/* Discount Badge */}
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-xs bg-[#F85606] text-white text-[10px] font-black uppercase shadow-xs">
                          -26%
                        </span>

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
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[11px] text-[#9E9E9E] line-through">
                            Rs. {strikePrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-[#212121] font-semibold bg-[#E7FFFD] px-1 rounded-xs">
                            -26%
                          </span>
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
          )}
        </main>
      </div>

    </div>
  );
};
