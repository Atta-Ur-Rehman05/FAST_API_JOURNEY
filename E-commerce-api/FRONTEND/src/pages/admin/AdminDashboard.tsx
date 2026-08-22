import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BarChart3, Users, ShoppingCart, Package, FolderTree, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { apiClient } from '../../lib/api-client';
import type { Category, PaginatedResponse, Product, Order, Review, MonthlyStats } from '../../types/api';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, orders: 0, products: 0, categories: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<number | null>(null);
  const [productPage, setProductPage] = useState(0);
  const PRODUCT_PAGE_SIZE = 10;

  // Recent Orders state
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersPage, setOrdersPage] = useState(0);
  const ORDERS_PAGE_SIZE = 5;

  // Chart state
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats['monthly']>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [usersRes, ordersRes, productsRes, categoriesRes, _reviewsRes] = await Promise.all([
          apiClient.get<PaginatedResponse<any>>('/users/', { params: { limit: 1 } }),
          apiClient.get<PaginatedResponse<Order>>('/orders/', { params: { limit: 1 } }),
          apiClient.get<PaginatedResponse<Product>>('/products/', { params: { limit: 100 } }),
          apiClient.get<PaginatedResponse<Category>>('/categories/', { params: { limit: 100 } }),
          apiClient.get<PaginatedResponse<Review>>('/reviews/', { params: { limit: 100 } }),
        ]);
        setStats({
          users: usersRes.data.total,
          orders: ordersRes.data.total,
          products: productsRes.data.total,
          categories: categoriesRes.data.total,
        });
        setProducts(productsRes.data.items);
        setCategories(categoriesRes.data.items);
      } catch (err: any) {
        const raw = err?.response?.data?.detail;
        const msg = typeof raw === 'string' ? raw : raw ? JSON.stringify(raw) : err?.message || 'Failed to load dashboard data';
        setError(msg);
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Fetch recent orders
  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await apiClient.get<PaginatedResponse<Order>>('/orders/', {
          params: { limit: ORDERS_PAGE_SIZE, skip: ordersPage * ORDERS_PAGE_SIZE },
        });
        setRecentOrders(res.data.items);
      } catch (err) {
        console.error('Error fetching recent orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [ordersPage]);

  // Fetch monthly stats for chart
  useEffect(() => {
    const fetchMonthlyStats = async () => {
      setChartLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const res = await apiClient.get<{ year: number; monthly: MonthlyStats['monthly'] }>('/admin/stats/monthly', {
          params: { year: currentYear },
        });
        setMonthlyStats(res.data.monthly);
      } catch (err) {
        console.error('Error fetching monthly stats:', err);
        // Fallback to empty data
        setMonthlyStats([]);
      } finally {
        setChartLoading(false);
      }
    };
    fetchMonthlyStats();
  }, []);

  const subcategories = useMemo(() => {
    if (!categoryFilter) return categories.filter((c) => !c.parent_id);
    return categories.filter((c) => c.parent_id === categoryFilter);
  }, [categories, categoryFilter]);

  const thirdLevelCategories = useMemo(() => {
    if (!subcategoryFilter) return categories.filter((c) => c.parent_id === categoryFilter);
    return categories.filter((c) => c.parent_id === subcategoryFilter);
  }, [categories, categoryFilter, subcategoryFilter]);

  const salesMap = useMemo(() => {
    // We don't have all orders loaded, so we'll compute from recentOrders or use 0
    // In a real implementation, you'd fetch all orders or have a dedicated sales endpoint
    const map: Record<string, number> = {};
    return map;
  }, [recentOrders]);

  const ratingMap = useMemo(() => {
    // Similar to sales, we'd need reviews data
    const map: Record<string, number> = {};
    return map;
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (categoryFilter) {
      const childIds = categories.filter((c) => c.parent_id === categoryFilter).map((c) => c.id);
      result = result.filter((p) => categoryFilter === p.category_id || childIds.includes(p.category_id));
    }
    if (subcategoryFilter) {
      result = result.filter((p) => p.category_id === subcategoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    return result;
  }, [products, categories, categoryFilter, subcategoryFilter, searchQuery]);

  const paginatedProducts = filteredProducts.slice(productPage * PRODUCT_PAGE_SIZE, (productPage + 1) * PRODUCT_PAGE_SIZE);
  const totalFilteredPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCT_PAGE_SIZE));

  useEffect(() => {
    setProductPage(0);
  }, [categoryFilter, subcategoryFilter, searchQuery]);

  const getCategoryName = (product: Product): string => {
    const cat = categories.find((c) => c.id === product.category_id);
    return cat?.name || '—';
  };

  const getSubcategoryName = (product: Product): string => {
    const cat = categories.find((c) => c.id === product.category_id);
    if (!cat || !cat.parent_id) return '—';
    const parent = categories.find((c) => c.id === cat.parent_id);
    return parent?.name || '—';
  };

  const getStock = (product: Product): number => {
    return product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0;
  };

  const getSales = (product: Product): number => {
    return product.variants?.reduce((sum, v) => sum + (salesMap[v.id] || 0), 0) || 0;
  };

  const getRating = (product: Product): number => {
    return ratingMap[product.id] || 0;
  };

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'bg-emerald-600', iconBg: 'bg-emerald-100 text-emerald-700' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'bg-blue-600', iconBg: 'bg-blue-100 text-blue-700' },
    { label: 'Total Products', value: stats.products, icon: Package, color: 'bg-indigo-600', iconBg: 'bg-indigo-100 text-indigo-700' },
    { label: 'Total Category', value: stats.categories, icon: FolderTree, color: 'bg-pink-600', iconBg: 'bg-pink-100 text-pink-700' },
  ];

  const totalUsersChartData = monthlyStats.map((m) => m.users);
  const totalSalesChartData = monthlyStats.map((m) => m.sales);
  const monthLabels = monthlyStats.map((m) => m.month);

  if (loading) {
    return <div className="text-center text-zinc-400 text-xs py-12">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-center text-rose-700 bg-rose-50 border border-rose-200 rounded-xs p-4 text-xs">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="ui-surface rounded-sm border border-zinc-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Welcome, <span className="text-blue-100">{user?.first_name || 'Admin'}</span>
              </h1>
              <p className="mt-2 text-sm text-blue-50">
                Here's What happening on your store today. See the statistics at once.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.color} rounded-lg p-5 text-white shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white/80">{stat.label}</p>
                  <p className="mt-1 text-2xl font-black">{stat.value}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg p-2 ${stat.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <BarChart3 className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Products Section */}
      <div className="ui-surface rounded-sm border border-zinc-700 overflow-hidden">
        <div className="p-5 border-b border-zinc-700 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-100">Products</h2>
          <button
            onClick={() => navigate('/admin/products')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
          >
            ADD PRODUCT
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-zinc-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Category By</label>
              <select
                value={categoryFilter || ''}
                onChange={(e) => { setCategoryFilter(e.target.value ? Number(e.target.value) : null); setSubcategoryFilter(null); }}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                <option value="">Select Category</option>
                {categories.filter((c) => !c.parent_id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Sub Category By</label>
              <select
                value={subcategoryFilter || ''}
                onChange={(e) => setSubcategoryFilter(e.target.value ? Number(e.target.value) : null)}
                disabled={!categoryFilter}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
              >
                <option value="">Select Sub Category</option>
                {subcategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Third Level Sub Category By</label>
              <select
                disabled={!subcategoryFilter}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
              >
                <option value="">Select Third Level</option>
                {thirdLevelCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search here..."
                  className="w-full p-2.5 pl-9 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-100">
            <thead className="bg-zinc-900 text-zinc-400 uppercase text-[11px] font-bold border-b border-zinc-700">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="rounded border-zinc-700 accent-zinc-100" />
                </th>
                <th className="px-4 py-3">PRODUCT</th>
                <th className="px-4 py-3">CATEGORY</th>
                <th className="px-4 py-3">SUB CATEGORY</th>
                <th className="px-4 py-3">PRICE</th>
                <th className="px-4 py-3">SALES</th>
                <th className="px-4 py-3">STOCK</th>
                <th className="px-4 py-3">RATING</th>
                <th className="px-4 py-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const primaryVariant = product.variants?.[0];
                  const price = primaryVariant ? Number(product.base_price) + Number(primaryVariant.price_modifier) : Number(product.base_price);
                  const stock = getStock(product);
                  const sales = getSales(product);
                  const rating = getRating(product);
                  return (
                    <tr key={product.id} className="hover:bg-zinc-900 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="rounded border-zinc-700 accent-zinc-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-zinc-100">{product.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{product.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{getCategoryName(product)}</td>
                      <td className="px-4 py-3 text-zinc-300">{getSubcategoryName(product)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-100">Rs. {price.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-mono text-zinc-100">{sales}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono font-bold ${stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400">★</span>
                          <span className="font-mono text-zinc-100">{rating > 0 ? rating : '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/products`)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded-md"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 text-zinc-400 hover:text-rose-600" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalFilteredPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-700">
            <button
              onClick={() => setProductPage((p) => Math.max(0, p - 1))}
              disabled={productPage === 0}
              className="flex items-center gap-1 px-3 py-1.5 border border-zinc-700 rounded-md text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs text-zinc-500">
              Page {productPage + 1} of {totalFilteredPages}
            </span>
            <button
              onClick={() => setProductPage((p) => Math.min(totalFilteredPages - 1, p + 1))}
              disabled={productPage >= totalFilteredPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-zinc-700 rounded-md text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-40"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Recent Orders Section */}
      <div className="ui-surface rounded-sm border border-zinc-700 overflow-hidden">
        <div className="p-5 border-b border-zinc-700 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-100">Recent Orders</h2>
          <div className="relative">
            <input
              type="text"
              value={ordersSearch}
              onChange={(e) => setOrdersSearch(e.target.value)}
              placeholder="Search here..."
              className="w-64 p-2.5 pl-9 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-100">
            <thead className="bg-zinc-900 text-zinc-400 uppercase text-[11px] font-bold border-b border-zinc-700">
              <tr>
                <th className="px-4 py-3">ORDER ID</th>
                <th className="px-4 py-3">PAYMENT ID</th>
                <th className="px-4 py-3">NAME</th>
                <th className="px-4 py-3">PHONE NUMBER</th>
                <th className="px-4 py-3">ADDRESS</th>
                <th className="px-4 py-3">PINCODE</th>
                <th className="px-4 py-3">TOTAL AMOUNT</th>
                <th className="px-4 py-3">EMAIL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ordersLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    Loading orders...
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const addr = order.shipping_address;
                  const fullAddress = [addr.address_line_1, addr.city, addr.state].filter(Boolean).join(', ');
                  return (
                    <tr key={order.id} className="hover:bg-zinc-900 transition-colors">
                      <td className="px-4 py-3 font-mono text-zinc-100">{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{order.payment?.id?.slice(0, 8) || '—'}</td>
                      <td className="px-4 py-3 text-zinc-100">{addr.full_name}</td>
                      <td className="px-4 py-3 text-zinc-300">{addr.phone}</td>
                      <td className="px-4 py-3 text-zinc-300 max-w-xs truncate">{fullAddress}</td>
                      <td className="px-4 py-3 text-zinc-300">{addr.postal_code}</td>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-100">Rs. {Number(order.total_amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-300">{order.user?.email || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-zinc-700">
          <button
            onClick={() => setOrdersPage((p) => Math.max(0, p - 1))}
            disabled={ordersPage === 0}
            className="p-1.5 border border-zinc-700 rounded-md text-zinc-400 hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-500 px-2">Page {ordersPage + 1}</span>
          <button
            onClick={() => setOrdersPage((p) => p + 1)}
            disabled={recentOrders.length < ORDERS_PAGE_SIZE}
            className="p-1.5 border border-zinc-700 rounded-md text-zinc-400 hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="ui-surface rounded-sm border border-zinc-700 p-5">
        <h2 className="text-base font-bold text-zinc-100 mb-4">Total Users & Total Sales</h2>
        {chartLoading ? (
          <div className="text-center text-zinc-400 text-xs py-12">Loading chart...</div>
        ) : monthlyStats.length === 0 ? (
          <div className="text-center text-zinc-500 text-xs py-12">No data available for the current year.</div>
        ) : (
          <div className="h-80 w-full">
            <BarChart
              data={{
                labels: monthLabels,
                datasets: [
                  {
                    label: 'Total Sales',
                    data: totalSalesChartData,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1,
                  },
                  {
                    label: 'Total Users',
                    data: totalUsersChartData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#a1a1aa', font: { size: 12 } },
                  },
                },
                scales: {
                  x: {
                    ticks: { color: '#71717a' },
                    grid: { color: '#27272a' },
                  },
                  y: {
                    ticks: { color: '#71717a' },
                    grid: { color: '#27272a' },
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Simple BarChart component using canvas
const BarChart: React.FC<{
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }>;
  };
  options: any;
}> = ({ data, options }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const allValues = data.datasets.flatMap((ds) => ds.data);
    const maxValue = Math.max(...allValues, 1);
    const barGroupWidth = chartWidth / data.labels.length;
    const barWidth = (barGroupWidth * 0.7) / data.datasets.length;

    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxValue - (maxValue / gridLines) * i;
      ctx.fillStyle = '#71717a';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(value).toLocaleString(), padding.left - 8, y + 3);
    }

    // Draw bars
    data.datasets.forEach((dataset, dsIndex) => {
      data.labels.forEach((_label, i) => {
        const value = dataset.data[i];
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding.left + barGroupWidth * i + (barGroupWidth * 0.15) + dsIndex * barWidth;
        const y = padding.top + chartHeight - barHeight;

        ctx.fillStyle = dataset.backgroundColor;
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    });

    // Draw X-axis labels
    ctx.fillStyle = '#71717a';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    data.labels.forEach((label, i) => {
      const x = padding.left + barGroupWidth * i + barGroupWidth / 2;
      ctx.fillText(label, x, height - padding.bottom + 15);
    });

    // Legend
    ctx.font = '11px sans-serif';
    data.datasets.forEach((dataset, i) => {
      const legendX = padding.left + i * 120;
      const legendY = height - 8;
      ctx.fillStyle = dataset.backgroundColor;
      ctx.fillRect(legendX, legendY - 6, 10, 10);
      ctx.fillStyle = '#a1a1aa';
      ctx.textAlign = 'left';
      ctx.fillText(dataset.label, legendX + 14, legendY + 3);
    });
  }, [data, options]);

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
