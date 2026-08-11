export type RoleType = 'customer' | 'admin';

export interface PaginatedResponse<T> { items: T[]; total: number; page: number; page_size: number; next_page: number | null; }

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: RoleType;
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

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  subcategories?: Category[];
  children?: Category[];
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

export type OrderStatus = 'draft' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
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

export interface CheckoutCreate {
  shipping_address_id: string;
  billing_address_id: string;
  payment_method: PaymentMethod;
}

export interface CheckoutResponse {
  order: Order;
  payment: Payment;
  stripe_client_secret?: string | null;
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
