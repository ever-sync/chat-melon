// =====================================================
// Orders / E-commerce Types
// =====================================================

export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'transfer' | 'cash' | 'other';
export type DiscountType = 'fixed' | 'percentage';

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  sku?: string;
  image_url?: string;
}

export interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface Order {
  id: string;
  company_id: string;
  contact_id?: string;
  conversation_id?: string;
  deal_id?: string;
  order_number: number;

  // Items
  items: OrderItem[];

  // Values
  subtotal: number;
  discount: number;
  discount_type: DiscountType;
  shipping: number;
  tax: number;
  total: number;

  // Status
  status: OrderStatus;

  // Payment
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  payment_id?: string;
  payment_provider?: string;
  paid_at?: string;

  // PIX
  pix_code?: string;
  pix_qrcode_url?: string;
  pix_expiration?: string;

  // Shipping
  shipping_address?: ShippingAddress;
  tracking_code?: string;
  shipped_at?: string;
  delivered_at?: string;

  // Notes
  customer_notes?: string;
  internal_notes?: string;

  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  contact?: {
    name: string;
    phone_number: string;
  };
}

export interface OrderStatusChange {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  changed_by?: string;
  created_at: string;
}

export interface CreateOrderInput {
  contact_id?: string;
  conversation_id?: string;
  deal_id?: string;
  items: OrderItem[];
  discount?: number;
  discount_type?: DiscountType;
  shipping?: number;
  tax?: number;
  payment_method?: PaymentMethod;
  shipping_address?: ShippingAddress;
  customer_notes?: string;
  internal_notes?: string;
}

export interface UpdateOrderInput {
  items?: OrderItem[];
  discount?: number;
  discount_type?: DiscountType;
  shipping?: number;
  tax?: number;
  status?: OrderStatus;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  shipping_address?: ShippingAddress;
  tracking_code?: string;
  customer_notes?: string;
  internal_notes?: string;
}

// Cart for building orders
export interface CartItem extends OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
  };
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  discount_type: DiscountType;
  shipping: number;
  total: number;
}
