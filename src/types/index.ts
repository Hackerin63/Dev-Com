export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  address: string;
  createdAt: Date | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPercent: number;
  category: string;
  imageUrl: string;
  stock: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: 'COD' | 'UPI' | 'RAZORPAY';
  paymentStatus: 'pending' | 'paid' | 'cash_on_delivery';
  paymentUpiId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress: string;
  phone: string;
  stockDeducted: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  quantity: number;
}

export interface AdminStats {
  products: number;
  orders: number;
  users: number;
  pendingOrders: number;
}
