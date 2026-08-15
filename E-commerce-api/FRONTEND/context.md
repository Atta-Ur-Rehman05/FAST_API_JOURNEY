# 📘 FRONTEND CONTEXT & BACKEND API CONTRACT (`context.md`)

This document serves as the single source of truth for AI Agents building the Frontend web application. It specifies the backend API architecture, data models, endpoints contract, authorization behavior, and expected frontend page routes.

---

## 🌐 1. Backend Service Overview

- **Base URL**: `http://127.0.0.1:8000/api/v1`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **OpenAPI Schema**: `http://127.0.0.1:8000/openapi.json`
- **Authentication**: JWT Bearer Token (passed via `Authorization: Bearer <access_token>` header).
- **Refresh Token**: HttpOnly cookie (`refresh_token`), rotated on each use.

---

## 🗂️ 2. Data Models & TypeScript Interfaces

```typescript
// User & Auth
export type RoleType = "customer" | "admin";

export interface User {
  id: string; // UUID
  email: string;
  first_name: string;
  last_name: string;
  role: RoleType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Address Management
export type AddressType = "Home" | "Office" | "Other" | "shipping" | "billing";

export interface Address {
  id: string; // UUID
  user_id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: AddressType;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressListResponse {
  items: Address[];
  total: number;
  page: number;
  page_size: number;
  next_page: number | null;
}

// Product Catalog & Categories
export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  subcategories?: Category[];
  children?: Category[];
}

export interface CategoryTreeResponse {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  children?: CategoryTreeResponse[];
}

export interface ProductImage {
  id: number;
  product_id: string;
  image_url: string;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string; // UUID
  product_id: string;
  sku: string;
  price_modifier: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  attributes?: Record<string, any>;
}

export interface Product {
  id: string; // UUID
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  category_id: number;
  is_active: boolean;
  variants?: ProductVariantCreate[];
  images?: ProductImageCreate[];
}

export interface ProductUpdate {
  name?: string;
  slug?: string;
  description?: string;
  base_price?: number;
  category_id?: number;
  is_active?: boolean;
}

export interface ProductVariantCreate {
  sku: string;
  price_modifier: number;
  stock_quantity: number;
  attributes?: Record<string, any>;
}

export interface ProductVariantUpdate {
  sku?: string;
  price_modifier?: number;
  stock_quantity?: number;
  attributes?: Record<string, any>;
}

export interface ProductImageCreate {
  image_url: string;
  is_primary: boolean;
}

export interface ProductImageUpdate {
  image_url?: string;
  is_primary?: boolean;
}

// Cart Module
export interface CartItem {
  id: number;
  cart_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  variant?: ProductVariant;
}

export interface Cart {
  id: string; // UUID
  user_id?: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface CartItemCreate {
  variant_id: string;
  quantity: number;
}

export interface CartItemUpdate {
  quantity: number;
}

// Checkout & Orders
export type OrderStatus = "draft" | "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "failed";
export type PaymentMethod = "credit_card" | "paypal" | "stripe" | "cod";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface OrderItem {
  id: number;
  order_id: string;
  variant_id: string;
  quantity: number;
  price_per_item: number;
  variant?: ProductVariant;
}

export interface OrderItemCreate {
  variant_id: string;
  quantity: number;
}

export interface OrderItemUpdate {
  quantity: number;
}

export interface Payment {
  id: string; // UUID
  order_id: string;
  payment_method: PaymentMethod;
  transaction_id?: string;
  amount: number;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface Order {
  id: string; // UUID
  user_id: string;
  shipping_address_id: string;
  billing_address_id: string;
  total_amount: number;
  order_status: OrderStatus;
  items: OrderItem[];
  payment?: Payment;
  shipping_address?: Address;
  billing_address?: Address;
  created_at: string;
  updated_at: string;
}

export interface OrderCreate {
  shipping_address_id: string;
  billing_address_id: string;
  payment_method: PaymentMethod;
  items?: OrderItemCreate[];
}

export interface OrderUpdate {
  shipping_address_id?: string;
  billing_address_id?: string;
  payment_method?: PaymentMethod;
}

export interface OrderStatusUpdate {
  order_status: OrderStatus;
}

export interface CheckoutCreate {
  shipping_address_id: string;
  billing_address_id: string;
  payment_method: PaymentMethod;
}

export interface CheckoutResponse {
  order: Order;
  payment: Payment;
  stripe_client_secret?: string | null;
  subtotal_amount: number;
  tax_amount: number;
  shipping_amount: number;
}

// Reviews Module
export interface Review {
  id: string; // UUID
  product_id: string;
  user_id: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
  user?: Partial<User>;
}

export interface ReviewCreate {
  product_id: string;
  rating: number;
  comment?: string;
}

export interface ReviewUpdate {
  rating?: number;
  comment?: string;
}

// Wishlist Module
export interface WishlistItem {
  id: string;
  product_id: string;
  created_at?: string;
  product?: Product;
}

export interface Wishlist {
  id: string;
  user_id: string;
  items: WishlistItem[];
  created_at?: string;
}

export interface WishlistItemCreate {
  product_id: string;
}

export interface WishlistResponse {
  id: string;
  user_id: string;
  items: WishlistItem[];
  created_at?: string;
}

export interface WishlistItemResponse {
  id: string;
  product_id: string;
  created_at?: string;
  product?: Product;
}

// Inventory Module
export interface InventoryItem {
  variant_id: string;
  product_id: string;
  product_name: string | null;
  sku: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

export interface InventoryStockSet {
  stock_quantity: number;
  reason?: string;
}

export interface InventoryStockAdjustment {
  quantity: number;
  reason?: string;
}

export interface InventoryAdjustmentResponse {
  variant_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  next_page: number | null;
}
```

---

## 📡 3. Complete API Endpoint Contract

| Domain | Method | Endpoint | Auth Required | Description |
|---|---|---|---|---|
| **Auth** | `POST` | `/auth/register` | No | Body: `{ email, password, first_name, last_name }` → `UserResponse` |
| **Auth** | `POST` | `/auth/login` | No | Form Data: `username`, `password` → `{ access_token, token_type }` (sets HttpOnly refresh cookie) |
| **Auth** | `POST` | `/auth/refresh` | Cookie | Returns new `{ access_token, token_type }` (rotates refresh cookie) |
| **Auth** | `POST` | `/auth/logout` | Cookie | Revokes refresh token, clears cookie → `204 No Content` |
| **Auth** | `POST` | `/auth/password-reset/request` | No | Body: `{ email }` → `{ message }` (dev: includes `reset_token` if `EXPOSE_RESET_TOKEN_IN_DEVELOPMENT`) |
| **Auth** | `POST` | `/auth/password-reset/confirm` | No | Body: `{ token, new_password }` → `204 No Content` |
| **Users** | `GET` | `/users/me` | Bearer Token | Returns current authenticated user profile |
| **Users** | `GET` | `/users/` | Admin | Query: `skip`, `limit`, `search` → `PaginatedResponse<UserResponse>` |
| **Users** | `PATCH` | `/users/{id}` | Admin | Body: `{ role?, is_active? }` → `UserResponse` |
| **Addresses** | `GET` | `/addresses/` | Bearer Token | Query: `skip`, `limit` → `AddressListResponse` |
| **Addresses** | `GET` | `/addresses/{id}` | Bearer Token | Returns single address |
| **Addresses** | `POST` | `/addresses/` | Bearer Token | Body: `AddressCreate` → `AddressResponse` |
| **Addresses** | `PUT` | `/addresses/{id}` | Bearer Token | Body: `AddressUpdate` → `AddressResponse` |
| **Addresses** | `DELETE` | `/addresses/{id}` | Bearer Token | `204 No Content` |
| **Addresses** | `PATCH` | `/addresses/{id}/default-shipping` | Bearer Token | Sets default shipping → `AddressResponse` |
| **Addresses** | `PATCH` | `/addresses/{id}/default-billing` | Bearer Token | Sets default billing → `AddressResponse` |
| **Categories** | `GET` | `/categories/` | No | Query: `skip`, `limit`, `parent_id`, `root_only`, `search` → `PaginatedResponse<CategoryResponse>` |
| **Categories** | `GET` | `/categories/tree` | No | Query: `skip`, `limit` → `PaginatedResponse<CategoryTreeResponse>` |
| **Categories** | `GET` | `/categories/{id}` | No | Returns single category |
| **Categories** | `POST` | `/categories/` | Admin | Body: `CategoryCreate` → `CategoryResponse` |
| **Categories** | `PATCH` | `/categories/{id}` | Admin | Body: `CategoryUpdate` → `CategoryResponse` |
| **Categories** | `DELETE` | `/categories/{id}` | Admin | `204 No Content` (restricted if has products/children) |
| **Products** | `GET` | `/products/` | No | Query: `skip`, `limit`, `category_id`, `is_active`, `search`, `sort_by`, `order`, `max_price`, `in_stock` → `PaginatedResponse<ProductResponse>` |
| **Products** | `GET` | `/products/{id}` | No | Returns detailed product with variants & images |
| **Products** | `POST` | `/products/` | Admin | Body: `ProductCreate` (includes variants/images) → `ProductResponse` |
| **Products** | `PATCH` | `/products/{id}` | Admin | Body: `ProductUpdate` → `ProductResponse` |
| **Products** | `DELETE` | `/products/{id}` | Admin | `204 No Content` (restricted if has order history) |
| **Products** | `POST` | `/products/{product_id}/variants` | Admin | Body: `ProductVariantCreate` → `ProductVariantResponse` |
| **Products** | `PATCH` | `/products/{product_id}/variants/{variant_id}` | Admin | Body: `ProductVariantUpdate` → `ProductVariantResponse` |
| **Products** | `DELETE` | `/products/{product_id}/variants/{variant_id}` | Admin | `204 No Content` |
| **Products** | `POST` | `/products/{product_id}/images` | Admin | Body: `ProductImageCreate` → `ProductImageResponse` |
| **Products** | `PATCH` | `/products/{product_id}/images/{image_id}` | Admin | Body: `ProductImageUpdate` → `ProductImageResponse` |
| **Products** | `DELETE` | `/products/{product_id}/images/{image_id}` | Admin | `204 No Content` |
| **Inventory** | `GET` | `/inventory/` | Admin | Query: `skip`, `limit`, `search`, `product_id`, `low_stock_threshold`, `low_stock_only`, `out_of_stock_only` → `PaginatedResponse<InventoryItem>` |
| **Inventory** | `GET` | `/inventory/{variant_id}` | Admin | Query: `low_stock_threshold` → `InventoryItem` |
| **Inventory** | `GET` | `/inventory/sku/{sku}` | Admin | Query: `low_stock_threshold` → `InventoryItem` |
| **Inventory** | `PATCH` | `/inventory/{variant_id}/stock` | Admin | Body: `{ stock_quantity, reason? }` → `InventoryAdjustmentResponse` |
| **Inventory** | `POST` | `/inventory/{variant_id}/restock` | Admin | Body: `{ quantity, reason? }` → `InventoryAdjustmentResponse` |
| **Inventory** | `POST` | `/inventory/{variant_id}/deduct` | Admin | Body: `{ quantity, reason? }` → `InventoryAdjustmentResponse` |
| **Inventory** | `POST` | `/inventory/{variant_id}/release` | Admin | Body: `{ quantity, reason? }` → `InventoryAdjustmentResponse` |
| **Cart** | `GET` | `/cart/me` | Bearer Token | Returns user's cart with items |
| **Cart** | `POST` | `/cart/items` | Bearer Token | Body: `{ variant_id, quantity }` → `CartItemResponse` |
| **Cart** | `PUT` | `/cart/items/{item_id}` | Bearer Token | Body: `{ quantity }` → `CartItemResponse` |
| **Cart** | `DELETE` | `/cart/items/{item_id}` | Bearer Token | `204 No Content` |
| **Cart** | `DELETE` | `/cart/clear` | Bearer Token | `204 No Content` |
| **Checkout** | `POST` | `/checkout/` | Bearer Token | Body: `CheckoutCreate`, Header: `Idempotency-Key` → `CheckoutResponse` (includes `stripe_client_secret`, `subtotal_amount`, `tax_amount`, `shipping_amount`) |
| **Orders** | `GET` | `/orders/me` | Bearer Token | Query: `skip`, `limit` → `PaginatedResponse<OrderResponse>` |
| **Orders** | `GET` | `/orders/` | Admin | Query: `skip`, `limit`, `search` → `PaginatedResponse<OrderResponse>` |
| **Orders** | `POST` | `/orders/` | Admin | Body: `OrderCreate` → `OrderResponse` |
| **Orders** | `GET` | `/orders/{id}` | Bearer Token (own) / Admin | Returns single order with items, payment, addresses |
| **Orders** | `PATCH` | `/orders/{id}` | Admin | Body: `OrderUpdate` → `OrderResponse` |
| **Orders** | `DELETE` | `/orders/{id}` | Admin | `204 No Content` (restricted if not editable) |
| **Orders** | `PATCH` | `/orders/{id}/status` | Admin | Body: `{ order_status }` → `OrderResponse` |
| **Orders** | `POST` | `/orders/{id}/cancel` | Bearer Token | Customer requests cancellation → `OrderResponse` |
| **Orders** | `POST` | `/orders/{id}/items` | Bearer Token (own) / Admin | Body: `OrderItemCreate` → `OrderItemResponse` |
| **Orders** | `PATCH` | `/orders/{id}/items/{item_id}` | Bearer Token (own) / Admin | Body: `{ quantity }` → `OrderItemResponse` |
| **Orders** | `DELETE` | `/orders/{id}/items/{item_id}` | Bearer Token (own) / Admin | `204 No Content` |
| **Checkout** | `POST` | `/checkout/` | Bearer Token | Body: `CheckoutCreate`, Header: `Idempotency-Key` → `CheckoutResponse` |
| **Reviews** | `GET` | `/reviews/` | No | Query: `skip`, `limit`, `product_id`, `user_id` → `PaginatedResponse<ReviewResponse>` |
| **Reviews** | `POST` | `/reviews/` | Bearer Token | Body: `{ product_id, rating, comment }` → `ReviewResponse` |
| **Reviews** | `GET` | `/reviews/{id}` | No | Returns single review |
| **Reviews** | `PATCH` | `/reviews/{id}` | Bearer Token | Body: `{ rating?, comment? }` (owner) → `ReviewResponse` |
| **Reviews** | `DELETE` | `/reviews/{id}` | Bearer Token | Owner or Admin → `204 No Content` |
| **Wishlist** | `GET` | `/wishlist/` | Bearer Token | Returns `WishlistResponse` (wrapper with items) |
| **Wishlist** | `GET` | `/wishlist/items` | Bearer Token | Returns `WishlistItemResponse[]` (array) |
| **Wishlist** | `POST` | `/wishlist/items` | Bearer Token | Body: `{ product_id }` → `WishlistItemResponse` |
| **Wishlist** | `DELETE` | `/wishlist/items/{product_id}` | Bearer Token | `204 No Content` |
| **Wishlist** | `DELETE` | `/wishlist/clear` | Bearer Token | `204 No Content` |
| **Payments** | `POST` | `/payments/stripe/webhook` | Stripe Signature | Handles Stripe events → `200 OK` |
| **Payments** | `POST` | `/payments/{payment_id}/refund` | Admin | Refunds completed Stripe payment → `PaymentResponse` |

---

## 🔐 4. Authorization Behavior

- **Public**: `GET /products/*`, `GET /categories/*`, `GET /reviews/`, `POST /auth/*`, `POST /checkout/` (requires auth)
- **Customer (Bearer Token)**: `/users/me`, `/addresses/*`, `/cart/*`, `/checkout/`, `/orders/me`, `/orders/{id}` (own), `/orders/{id}/cancel`, `/orders/{id}/items`, `/reviews/` (POST), `/reviews/{id}` (PATCH/DELETE own), `/wishlist/*`, `/orders/{id}/items` (own)
- **Admin (Bearer Token + role=admin)**: All customer endpoints + `/users/*`, `/categories/*` (write), `/products/*` (write), `/inventory/*`, `/orders/` (all), `/orders/{id}/items` (all), `/orders/{id}/status`, `/orders/{id}/cancel`, `/payments/{id}/refund`, `/reviews/{id}` (DELETE any)

---

## 🚀 5. Frontend Page Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Redirects to `/products` |
| `/products` | Public | Product catalog with filters |
| `/products/:id` | Public | Product detail with reviews |
| `/login` | Public | Email/password login |
| `/register` | Public | Account creation |
| `/forgot-password` | Public | Password reset request |
| `/reset-password` | Public | Password reset confirm (token in URL) |
| `/account/addresses` | Customer | Address book CRUD |
| `/account/orders` | Customer | Order history + cancel |
| `/wishlist` | Customer | Saved items |
| `/checkout` | Customer | Place order (Stripe + COD) |
| `/admin` | Admin | Dashboard |
| `/admin/products` | Admin | Product/variant/image CRUD |
| `/admin/inventory` | Admin | Stock matrix + adjustments |
| `/admin/categories` | Admin | Category tree CRUD |
| `/admin/orders` | Admin | Order fulfillment + refunds |
| `/admin/users` | Admin | User management (role, status) |
| `*` | Any | Redirects to `/products` |

---

## ⚠️ 6. Known Frontend/Backend Deltas (Resolved)

| Issue | Resolution |
|---|---|
| Reviews endpoint path | Frontend uses `GET /reviews/?product_id={id}` (matches backend) |
| Wishlist store vs page | Both use `/wishlist/items` (array) |
| Product update method | `PATCH /products/{id}` (backend uses PATCH) |
| Inventory stock update | `PATCH /inventory/{variant_id}/stock` (backend uses PATCH) |
| Inventory stock adjust | `POST /inventory/{variant_id}/restock\|deduct\|release` |
| Review edit/delete | `PATCH/DELETE /reviews/{id}` (backend supports) |
| Wishlist endpoints | `/wishlist/items` (array), `/wishlist/clear` |
| Category tree | `GET /categories/tree` |
| Category update/delete | `PATCH/DELETE /categories/{id}` |
| Inventory adjustments | `POST /inventory/{id}/restock\|deduct\|release` |
| Order admin endpoints | `GET /orders/`, `DELETE /orders/{id}`, `POST /orders/{id}/cancel` |
| Order item management | `PATCH/DELETE /orders/{id}/items/{item_id}` |
| Payment refunds | `POST /payments/{payment_id}/refund` |
| Category tree endpoint | `GET /categories/tree` |
| Password reset | `/auth/password-reset/request`, `/auth/password-reset/confirm` |
| Logout | `POST /auth/logout` |
| Admin user management | `GET /users/`, `PATCH /users/{id}` |

---

## 📝 7. Implementation Notes

- **Idempotency**: Checkout requires `Idempotency-Key` header for duplicate protection
- **Stripe**: Payment intent client secret returned in `CheckoutResponse.stripe_client_secret`
- **Refresh Token**: Stored in HttpOnly cookie, rotated on each `/auth/refresh`
- **Rate Limiting**: Login endpoint rate-limited by IP + email
- **CORS**: Configured via `settings.CORS_ORIGINS` (no wildcards with credentials)
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc. set by middleware
- **Pagination**: All list endpoints use `PaginatedResponse<T>` with `skip`/`limit`
- **Search**: Most list endpoints support `search` query parameter
- **Filtering**: Products support `category_id`, `max_price`, `in_stock`; Inventory supports `low_stock_only`, `out_of_stock_only`