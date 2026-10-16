import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';

import { NEXT_STATUS } from '@/constants/config';
import type { CartItem, Order, OrderItem, OrderStatus } from '@/types';
import { formatPrice, getDiscountedPrice } from '@/utils/format';
import { db } from './firebase';

function toDate(value: unknown): Date | null {
  return value && typeof (value as Timestamp).toDate === 'function' ? (value as Timestamp).toDate() : null;
}

function mapOrder(id: string, data: DocumentData): Order {
  const items: OrderItem[] = Array.isArray(data.items)
    ? data.items.map((i: DocumentData) => ({
        productId: String(i.productId ?? ''),
        name: String(i.name ?? ''),
        price: Number(i.price ?? 0),
        quantity: Number(i.quantity ?? 0),
        imageUrl: String(i.imageUrl ?? ''),
      }))
    : [];
  return {
    id,
    userId: String(data.userId ?? ''),
    customerName: String(data.customerName ?? ''),
    customerEmail: String(data.customerEmail ?? ''),
    items,
    total: Number(data.total ?? 0),
    status: (data.status ?? 'pending') as OrderStatus,
    paymentMethod: data.paymentMethod === 'UPI' ? 'UPI' : 'COD',
    paymentStatus:
      data.paymentStatus === 'paid'
        ? 'paid'
        : data.paymentMethod === 'UPI'
          ? 'pending'
          : 'cash_on_delivery',
    paymentUpiId: String(data.paymentUpiId ?? ''),
    shippingAddress: String(data.shippingAddress ?? ''),
    phone: String(data.phone ?? ''),
    stockDeducted: data.stockDeducted === true,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function byNewest(a: Order, b: Order): number {
  return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
}

interface NewOrderInput {
  userId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  shippingAddress: string;
  items: CartItem[];
  paymentMethod: 'COD' | 'UPI';
  paymentUpiId: string;
}

/**
 * Places an order. UPI transfers are not verified automatically; an admin must confirm payment
 * before confirming an UPI order. Stock is deducted only when an admin confirms the order.
 */
export async function createOrder(input: NewOrderInput): Promise<string> {
  if (input.items.length === 0) throw new Error('Your cart is empty.');
  if (input.paymentMethod === 'UPI' && !input.paymentUpiId.trim()) {
    throw new Error('UPI payments are not configured. Choose Cash on Delivery or contact the shop.');
  }

  // Re-read each product so the customer is told about out-of-stock items before ordering.
  const fresh = await Promise.all(input.items.map((i) => getDoc(doc(db, 'products', i.productId))));
  const items: OrderItem[] = [];
  fresh.forEach((snap, index) => {
    const cartItem = input.items[index];
    if (!snap.exists()) throw new Error(`"${cartItem.name}" is no longer available. Remove it from your cart.`);
    const data = snap.data();
    const stock = Number(data.stock ?? 0);
    if (stock < cartItem.quantity) {
      throw new Error(
        stock === 0
          ? `"${cartItem.name}" is out of stock. Remove it from your cart.`
          : `Only ${stock} of "${cartItem.name}" left. Reduce the quantity in your cart.`,
      );
    }
    items.push({
      productId: snap.id,
      name: String(data.name ?? cartItem.name),
      price: getDiscountedPrice(Number(data.price ?? cartItem.price), Number(data.discountPercent ?? 0)),
      quantity: cartItem.quantity,
      imageUrl: String(data.imageUrl ?? '').startsWith('data:image/') ? '' : String(data.imageUrl ?? ''),
    });
  });

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const ref = await addDoc(collection(db, 'orders'), {
    userId: input.userId,
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail,
    items,
    total,
    status: 'pending',
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === 'UPI' ? 'pending' : 'cash_on_delivery',
    paymentUpiId: input.paymentMethod === 'UPI' ? input.paymentUpiId.trim() : '',
    shippingAddress: input.shippingAddress.trim(),
    phone: input.phone.trim(),
    stockDeducted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserOrders(uid: string): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', uid)));
  return snap.docs.map((d) => mapOrder(d.id, d.data())).sort(byNewest);
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', id));
  return snap.exists() ? mapOrder(snap.id, snap.data()) : null;
}

/** Admin only (enforced by Firestore rules). */
export async function getAllOrders(): Promise<Order[]> {
  const snap = await getDocs(collection(db, 'orders'));
  return snap.docs.map((d) => mapOrder(d.id, d.data())).sort(byNewest);
}

/** Admin only (enforced by Firestore rules). Confirms a UPI transfer after checking the bank app. */
export async function markOrderPaid(orderId: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), {
    paymentStatus: 'paid',
    updatedAt: serverTimestamp(),
  });
}

/** Admins may delete any order; customers may delete only their own eligible pending orders. */
export async function deleteOrder(orderId: string): Promise<void> {
  await deleteDoc(doc(db, 'orders', orderId));
}

/**
 * Admin only (enforced by Firestore rules). Changes the status in a transaction.
 * - pending -> confirmed: checks the prices against the catalogue and deducts stock.
 * - cancelled after confirmation: puts the stock back.
 */
export async function updateOrderStatus(order: Order, next: OrderStatus): Promise<void> {
  if (!NEXT_STATUS[order.status].includes(next)) {
    throw new Error('That status change is not allowed.');
  }
  if (next === 'confirmed' && order.paymentMethod === 'UPI' && order.paymentStatus !== 'paid') {
    throw new Error('Verify the UPI transfer and mark the order as paid before confirming it.');
  }

  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', order.id);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) throw new Error('This order no longer exists.');

    const current = orderSnap.data();
    if (current.status !== order.status) {
      throw new Error('Someone else already changed this order. Refresh the list and try again.');
    }

    const wasDeducted = current.stockDeducted === true;
    const deduct = next === 'confirmed' && !wasDeducted;
    const restore = next === 'cancelled' && wasDeducted;
    let stockDeducted = wasDeducted;

    if (deduct || restore) {
      // All reads must happen before any writes inside a transaction.
      const productRefs = order.items.map((i) => doc(db, 'products', i.productId));
      const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

      if (deduct) {
        // Customers can edit prices in their own app, so the admin confirmation step re-checks them.
        const recomputed = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        if (Math.abs(recomputed - Number(current.total)) > 0.001) {
          throw new Error('The order total does not match its items. Cancel this order.');
        }
        productSnaps.forEach((snap, index) => {
          const item = order.items[index];
          if (!snap.exists()) throw new Error(`"${item.name}" no longer exists in the catalogue.`);
          const data = snap.data();
          const currentPrice = getDiscountedPrice(Number(data.price), Number(data.discountPercent ?? 0));
          if (Math.abs(currentPrice - item.price) > 0.001) {
            throw new Error(
              `Price mismatch for "${item.name}": order ${formatPrice(item.price)}, catalogue ${formatPrice(currentPrice)}. Cancel this order.`,
            );
          }
          if (Number(data.stock) < item.quantity) {
            throw new Error(`Not enough stock for "${item.name}" (${Number(data.stock)} left).`);
          }
        });
        productSnaps.forEach((snap, index) => {
          tx.update(productRefs[index], {
            stock: Number(snap.data()?.stock) - order.items[index].quantity,
            updatedAt: serverTimestamp(),
          });
        });
        stockDeducted = true;
      } else {
        productSnaps.forEach((snap, index) => {
          if (snap.exists()) {
            tx.update(productRefs[index], {
              stock: Number(snap.data().stock) + order.items[index].quantity,
              updatedAt: serverTimestamp(),
            });
          }
        });
        stockDeducted = false;
      }
    }

    tx.update(orderRef, { status: next, stockDeducted, updatedAt: serverTimestamp() });
  });
}
