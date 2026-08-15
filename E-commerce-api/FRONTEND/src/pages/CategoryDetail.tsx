import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Category, Product, PaginatedResponse } from '../types/api';
import { apiClient } from '../lib/api-client';
import { ProductVisual } from '../components/product/ProductVisual';

export const CategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 24;

  const fetchCategory = async () => {
    if (!id) return;
    try {
      const res = await apiClient.get<Category>(`/categories/${id}`);
      setCategory(res.data);
    } catch (err) {
      console.error('Error fetching category:', err);
    }
  };

  const fetchProducts = async () => {
    if (!id) return;
    try {
      const res = await apiClient.get<PaginatedResponse<Product>>('/products/', {
        params: {
          category_id: Number(id),
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
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
  };

  useEffect(() => {
    fetchCategory();
    fetchProducts();
  }, [id, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-[.16em] text-zinc-500">Loading category...</div>;
  }

  if (!category) {
    return (
      <div className="ui-surface mx-auto my-12 max-w-7xl space-y-4 rounded-2xl px-4 py-16 text-center">
        <p className="font-mono text-[10px] font-bold tracking-[.16em] text-zinc-500">RECORD UNAVAILABLE</p>
        <h2 className="text-xl font-black text-zinc-100">Category not found</h2>
        <button onClick={() => navigate('/products')} className="btn-primary text-xs">Return to Catalog</button>
      </div>
    );
  }

  const renderCategoryButton = (cat: Category, depth: number = 0): React.ReactNode => (
    <React.Fragment key={cat.id}>
      <button
        onClick={() => { navigate(`/categories/${cat.id}`); }}
        className={`w-full text-left px-3 py-2 rounded-xs text-xs transition-colors flex items-center justify-between ${
          category.id === cat.id
            ? 'bg-zinc-100 text-zinc-950 font-bold'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
        }`}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        <span className="truncate pr-2">{cat.name}</span>
        {depth > 0 && <ChevronRight className="w-3 h-3 opacity-60" />}
      </button>
      {cat.children?.map((child) => renderCategoryButton(child, depth + 1))}
    </React.Fragment>
  );

  return (
    <div className="min-h-full bg-zinc-950">
      <section className="border-b border-zinc-800 bg-zinc-950 px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center lg:gap-16">
          <div className="max-w-2xl">
            <button
              onClick={() => navigate('/products')}
              className="ui-icon-button flex w-fit items-center gap-2 px-2 py-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to catalog</span>
            </button>
            <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[.16em] text-zinc-400">
              CATALOG // CATEGORY
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">{category.name}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              {category.description || 'Browse products in this category.'}
            </p>
            {category.parent_id && (
              <p className="mt-2 text-xs text-zinc-500">Subcategory of category #{category.parent_id}</p>
            )}
          </div>
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <ProductVisual product={{ id: '', name: category.name, slug: category.slug, base_price: 0, is_active: true, variants: [], images: [], category_id: category.id }} priority />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="ui-surface grid grid-cols-1 gap-5 rounded-2xl p-4 sm:p-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:p-8">
          <div className="min-w-0 lg:col-span-2">
            <h2 className="text-base font-bold text-zinc-100 mb-4">Subcategories</h2>
            {category.children?.length ? (
              <div className="space-y-1">
                {category.children.map((child) => renderCategoryButton(child))}
              </div>
            ) : (
              <p className="text-zinc-400 text-xs">No subcategories</p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-100">Products in {category.name} ({total})</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 border border-zinc-700 rounded-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 border border-zinc-700 rounded-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400 text-xs py-12">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="ui-surface p-12 rounded-sm text-center space-y-3">
            <Tag className="w-10 h-10 text-zinc-400 mx-auto" />
            <p className="text-base font-bold text-zinc-100">No products found</p>
            <p className="text-xs text-zinc-400">There are no active products in this category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <div className="ui-card p-4 rounded-sm flex flex-col justify-between space-y-3">
                    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                      <ProductVisual product={product} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 line-clamp-1">{product.name}</h3>
                      <p className="text-[11px] text-zinc-400">SKU: {product.variants[0]?.sku || 'N/A'}</p>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-2xl font-black text-zinc-100 sm:text-3xl">
                        {product.variants[0] ? `${(Number(product.base_price) + Number(product.variants[0].price_modifier)).toFixed(2)}` : product.base_price}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-primary text-xs font-bold py-2 px-4 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs text-zinc-400 px-4">Page {page + 1} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="btn-primary text-xs font-bold py-2 px-4 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};