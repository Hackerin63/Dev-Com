import type { OrderStatus } from '@/types';

export const APP_NAME = 'Dev-Com';

/** Change this one line to switch currency symbol everywhere. */
export const CURRENCY_SYMBOL = '₹';

export const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Books', 'Sports', 'Beauty'] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Electronics: 'headset-outline',
  Fashion: 'shirt-outline',
  Home: 'home-outline',
  Books: 'book-outline',
  Sports: 'basketball-outline',
  Beauty: 'flower-outline',
};

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Allowed status transitions (admin only). */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export const MAX_CART_QTY_PER_ITEM = 20;
