import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { MAX_CART_QTY_PER_ITEM } from '@/constants/config';
import type { CartItem, Product } from '@/types';
import { getDiscountedPrice } from '@/utils/format';
import { useAuth } from './AuthContext';

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (product: Product, quantity?: number) => { ok: boolean; message?: string };
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  quantityOf: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === 'string' &&
    typeof v.name === 'string' &&
    typeof v.price === 'number' &&
    typeof v.imageUrl === 'string' &&
    typeof v.stock === 'number' &&
    typeof v.quantity === 'number'
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  // Remounting per user gives every account a fresh cart state without resetting state in an effect.
  return (
    <CartStore key={uid ?? 'guest'} uid={uid}>
      {children}
    </CartStore>
  );
}

function CartStore({ uid, children }: { uid: string | null; children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const loaded = useRef(false);

  // Load the saved cart for the signed-in user (each user has their own cart on this phone).
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    AsyncStorage.getItem(`devcom.cart.${uid}`)
      .then((raw) => {
        if (cancelled) return;
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setItems(parsed.filter(isCartItem));
      })
      .catch(() => {
        // A corrupt or unreadable saved cart is simply ignored.
      })
      .finally(() => {
        if (!cancelled) loaded.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Save whenever the cart changes (only after the first load, so we never overwrite a saved cart with []).
  useEffect(() => {
    if (!uid || !loaded.current) return;
    AsyncStorage.setItem(`devcom.cart.${uid}`, JSON.stringify(items)).catch(() => {});
  }, [items, uid]);

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      if (product.stock <= 0) return { ok: false, message: 'This item is out of stock.' };
      const existing = items.find((i) => i.productId === product.id);
      const salePrice = getDiscountedPrice(product.price, product.discountPercent);
      const limit = Math.min(product.stock, MAX_CART_QTY_PER_ITEM);
      const nextQty = (existing?.quantity ?? 0) + quantity;
      if (nextQty > limit) {
        return { ok: false, message: `You can order at most ${limit} of this item.` };
      }
      if (existing) {
        setItems(
          items.map((i) =>
            i.productId === product.id ? { ...i, quantity: nextQty, stock: product.stock, price: salePrice } : i,
          ),
        );
      } else {
        setItems([
          ...items,
          {
            productId: product.id,
            name: product.name,
            price: salePrice,
            imageUrl: product.imageUrl,
            stock: product.stock,
            quantity,
          },
        ]);
      }
      return { ok: true };
    },
    [items],
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      current
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(quantity, i.stock, MAX_CART_QTY_PER_ITEM) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const quantityOf = useCallback(
    (productId: string) => items.find((i) => i.productId === productId)?.quantity ?? 0,
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clear,
      quantityOf,
    }),
    [items, addItem, setQuantity, removeItem, clear, quantityOf],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
