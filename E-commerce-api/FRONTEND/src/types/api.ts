export type RoleType = 'customer' | 'admin';

export interface PaginatedResponse<T> { items: T[]; total: number; page: number; page_size: number; next_page: number | null; }

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: RoleType;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export type AddressType = 'Home' | 'Office' | 'Other' | 'shipping' | 'billing';

export interface Address {
  id: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface AddressListResponse {
  items: Address[];
  total: number;
  page: number;
  page_size: number;
  next_page: number | null;
}

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
  id: string;
  product_id: string;
  sku: string;
  price_modifier: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  attributes?: Record<string, any>;
}

export interface Product {
  id: string;
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  category?: Category;
  created_at?: string;
  updated_at?: string;
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

export interface CartItem {
  id: number;
  cart_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  user_id?: string;
  items: CartItem[];
  created_at?: string;
  updated_at?: string;
}

export interface CartItemCreate {
  variant_id: string;
  quantity: number;
}

export interface CartItemUpdate {
  quantity: number;
}

export type OrderStatus = 'draft' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
export type PaymentMethod = 'credit_card' | 'paypal' | 'stripe' | 'cod';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

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
  id: string;
  order_id: string;
  payment_method: PaymentMethod;
  transaction_id?: string;
  amount: number;
  payment_status: PaymentStatus;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  shipping_address_id: string;
  billing_address_id: string;
  total_amount: number;
  order_status: OrderStatus;
  items: OrderItem[];
  payment?: Payment;
  shipping_address?: Address;
  billing_address?: Address;
  created_at?: string;
  updated_at?: string;
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

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at?: string;
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