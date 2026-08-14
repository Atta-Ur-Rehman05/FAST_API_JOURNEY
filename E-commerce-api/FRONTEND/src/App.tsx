import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

import { ErrorBoundary } from './components/ErrorBoundary';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Addresses } from './pages/Addresses';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { WishlistPage } from './pages/Wishlist';

import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminUsers } from './pages/admin/AdminUsers';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans">
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
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                   {/* Customer Account Routes */}
                   <Route path="/account/addresses" element={<Addresses />} />
                   <Route path="/account/orders" element={<Orders />} />
                   <Route path="/wishlist" element={<WishlistPage />} />
                   <Route path="/checkout" element={<Checkout />} />

                   {/* Admin Portal Routes */}
                   <Route path="/admin" element={<AdminLayout />}>
                     <Route index element={<AdminDashboard />} />
                     <Route path="products" element={<AdminProducts />} />
                     <Route path="inventory" element={<AdminInventory />} />
                     <Route path="categories" element={<AdminCategories />} />
                     <Route path="orders" element={<AdminOrders />} />
                     <Route path="users" element={<AdminUsers />} />
                   </Route>

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/products" replace />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
