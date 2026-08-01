# 📘 FRONTEND CONTEXT & BACKEND API CONTRACT (`context.md`)

This document serves as the single source of truth for AI Agents building the Frontend web application. It specifies the backend API architecture, data models, endpoints contract, authorization behavior, and expected frontend page routes.

---

## 🌐 1. Backend Service Overview

- **Base URL**: `http://127.0.0.1:8000/api/v1`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **OpenAPI Schema**: `http://127.0.0.1:8000/openapi.json`
- **Authentication**: JWT Bearer Token (passed via `Authorization: Bearer <access_token>` header).

---

## 🗂️ 2. Data Models & TypeScript Interfaces

```typescript
// User & Auth
export type RoleType = "customer" | "admin" | "seller";

export interface User {
  id: string; // UUID
  email: string;
  first_name: string;
  last_name: string;
  role: RoleType;
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

// Product Catalog & Categories
export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  subcategories?: Category[];
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

// Cart Module
export interface CartItem {
  id: number;
  cart_id: string;
  variant_id: string;
  quantity: number;
  variant?: ProductVariant;
}

export interface Cart {
  id: string; // UUID
  user_id?: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

// Checkout & Orders
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
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

export interface CheckoutCreate {
  shipping_address_id: string;
  billing_address_id: string;
  payment_method: PaymentMethod;
}

export interface CheckoutResponse {
  order: Order;
  payment: Payment;
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
```

---

## 📡 3. Complete API Endpoint Contract

| Domain | Method | Endpoint | Auth Required | Description |
|---|---|---|---|---|
| **Auth** | `POST` | `/auth/register` | No | Body: `{ email, password, first_name, last_name }` |
| **Auth** | `POST` | `/auth/login` | No | Form Data: `username`, `password` $\rightarrow$ `{ access_token, token_type }` |
| **Users** | `GET` | `/users/me` | Bearer Token | Returns current authenticated user profile |
| **Address** | `GET` | `/addresses/` | Bearer Token | List all user addresses |
| **Address** | `POST` | `/addresses/` | Bearer Token | Add new address |
| **Address** | `PUT` | `/addresses/{id}` | Bearer Token | Update existing address |
| **Address** | `DELETE`| `/addresses/{id}` | Bearer Token | Delete address |
| **Address** | `PATCH`| `/addresses/{id}/default-shipping` | Bearer Token | Set address as default shipping |
| **Address** | `PATCH`| `/addresses/{id}/default-billing` | Bearer Token | Set address as default billing |
| **Category**| `GET` | `/categories/` | No | List product categories |
| **Category**| `POST` | `/categories/` | Admin | Create category |
| **Products**| `GET` | `/products/` | No | List products with pagination/search |
| **Products**| `GET` | `/products/{id}` | No | Get detailed product info |
| **Products**| `POST` | `/products/` | Admin/Seller | Create product |
| **Products**| `PUT` | `/products/{id}` | Admin/Seller | Update product |
| **Inventory**|`GET` | `/inventory/` | Admin/Seller | List inventory items |
| **Inventory**|`PUT` | `/inventory/{variant_id}` | Admin/Seller | Body: `{ stock_quantity }` |
| **Cart** | `GET` | `/cart/me` | Bearer Token | Get user shopping cart |
| **Cart** | `POST` | `/cart/items` | Bearer Token | Body: `{ variant_id, quantity }` |
| **Cart** | `PUT` | `/cart/items/{item_id}` | Bearer Token | Body: `{ quantity }` |
| **Cart** | `DELETE`| `/cart/items/{item_id}` | Bearer Token | Remove item from cart |
| **Cart** | `DELETE`| `/cart/clear` | Bearer Token | Empty shopping cart |
| **Checkout**| `POST` | `/checkout/` | Bearer Token | Body: `{ shipping_address_id, billing_address_id, payment_method }` |
| **Orders** | `GET` | `/orders/me` | Bearer Token | List user orders |
| **Orders** | `GET` | `/orders/{id}` | Bearer Token | Get single order details |
| **Orders** | `PATCH`| `/orders/{id}/status` | Admin | Body: `{ order_status }` |
| **Reviews** | `GET` | `/reviews/product/{product_id}` | No | List reviews for product |
| **Reviews** | `POST` | `/reviews/` | Bearer Token | Body: `{ product_id, rating, comment }` |
