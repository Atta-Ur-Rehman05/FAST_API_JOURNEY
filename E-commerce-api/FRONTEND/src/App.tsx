import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

import { Navbar } from './components/layout/Navbar';
import { CartDrawer } from './components/cart/CartDrawer';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Addresses } from './pages/Addresses';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';

import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOrders } from './pages/admin/AdminOrders';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
            <Navbar />
            <CartDrawer />

            <div className="flex-1">
              <Routes>
                {/* Storefront Routes */}
                <Route path="/" element={<Navigate to="/products" replace />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Customer Account Routes */}
                <Route path="/account/addresses" element={<Addresses />} />
                <Route path="/account/orders" element={<Orders />} />
                <Route path="/checkout" element={<Checkout />} />

                {/* Admin & Seller Portal Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="orders" element={<AdminOrders />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/products" replace />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
