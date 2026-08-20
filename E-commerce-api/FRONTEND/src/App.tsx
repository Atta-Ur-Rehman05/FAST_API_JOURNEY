import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Suspense, lazy } from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { AdminRoute } from './components/auth/AdminRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Addresses } from './pages/Addresses';
import { AddressDetail } from './pages/AddressDetail';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { WishlistPage } from './pages/Wishlist';
import { WishlistDetail } from './pages/WishlistDetail';
import { CategoryDetail } from './pages/CategoryDetail';
import { ReviewDetail } from './pages/ReviewDetail';

// Admin routes - code split to reduce initial bundle size for non-admin users
const AdminLayout = lazy(() => import('./components/layout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminHomeSlides = lazy(() => import('./pages/admin/AdminHomeSlides').then(m => ({ default: m.AdminHomeSlides })));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories').then(m => ({ default: m.AdminCategories })));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners').then(m => ({ default: m.AdminBanners })));
const AdminBlogs = lazy(() => import('./pages/admin/AdminBlogs').then(m => ({ default: m.AdminBlogs })));
const AdminManageLogo = lazy(() => import('./pages/admin/AdminManageLogo').then(m => ({ default: m.AdminManageLogo })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory').then(m => ({ default: m.AdminInventory })));

const AdminSuspense = ({ children }: { children: React.ReactNode }) => <Suspense fallback={<div className="text-center text-zinc-400 text-xs py-12">Loading admin panel...</div>}>{children}</Suspense>;

export function App() {
  return (
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
                  <Route path="/account/addresses/:id" element={<AddressDetail />} />
                  <Route path="/account/orders" element={<Orders />} />
                  <Route path="/account/orders/:id" element={<OrderDetail />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/wishlist/detail" element={<WishlistDetail />} />
                  <Route path="/categories/:id" element={<CategoryDetail />} />
                  <Route path="/reviews/:id" element={<ReviewDetail />} />
                  <Route path="/checkout" element={<Checkout />} />

                  {/* Admin Portal Routes - code split */}
                  <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                    <Route index element={<AdminSuspense><AdminDashboard /></AdminSuspense>} />
                    <Route path="slides" element={<AdminSuspense><AdminHomeSlides /></AdminSuspense>} />
                    <Route path="categories" element={<AdminSuspense><AdminCategories /></AdminSuspense>} />
                    <Route path="products" element={<AdminSuspense><AdminProducts /></AdminSuspense>} />
                    <Route path="inventory" element={<AdminSuspense><AdminInventory /></AdminSuspense>} />
                    <Route path="banners" element={<AdminSuspense><AdminBanners /></AdminSuspense>} />
                    <Route path="blogs" element={<AdminSuspense><AdminBlogs /></AdminSuspense>} />
                    <Route path="logo" element={<AdminSuspense><AdminManageLogo /></AdminSuspense>} />
                    <Route path="orders" element={<AdminSuspense><AdminOrders /></AdminSuspense>} />
                    <Route path="users" element={<AdminSuspense><AdminUsers /></AdminSuspense>} />
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
  );
}

export default App;
