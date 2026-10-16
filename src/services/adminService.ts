import { collection, getCountFromServer, query, where } from 'firebase/firestore';

import type { AdminStats } from '@/types';
import { db } from './firebase';

/** Admin only (enforced by Firestore rules). */
export async function getAdminStats(): Promise<AdminStats> {
  const [products, orders, users, pending] = await Promise.all([
    getCountFromServer(collection(db, 'products')),
    getCountFromServer(collection(db, 'orders')),
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'pending'))),
  ]);
  return {
    products: products.data().count,
    orders: orders.data().count,
    users: users.data().count,
    pendingOrders: pending.data().count,
  };
}
