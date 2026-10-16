import * as ImageManipulator from 'expo-image-manipulator';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    updateDoc,
    type DocumentData,
    type Timestamp,
} from 'firebase/firestore';

import type { Product, ProductInput } from '@/types';
import { db } from './firebase';

const MAX_PRODUCT_IMAGE_DATA_URI_LENGTH = 650_000;
const PRODUCT_IMAGE_MAX_DIMENSION = 640;

function toDate(value: unknown): Date | null {
  return value && typeof (value as Timestamp).toDate === 'function' ? (value as Timestamp).toDate() : null;
}

export function mapProduct(id: string, data: DocumentData): Product {
  return {
    id,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    price: Number(data.price ?? 0),
    discountPercent: Number(data.discountPercent ?? 0),
    category: String(data.category ?? ''),
    imageUrl: String(data.imageUrl ?? ''),
    stock: Number(data.stock ?? 0),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs
    .map((d) => mapProduct(d.id, d.data()))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, 'products', id));
  return snap.exists() ? mapProduct(snap.id, snap.data()) : null;
}

export async function prepareProductImage(uri: string, width: number, height: number): Promise<string> {
  const scale = Math.min(1, PRODUCT_IMAGE_MAX_DIMENSION / Math.max(width, height));
  const actions = scale < 1
    ? [{ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } }]
    : [];
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.65,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!result.base64) throw new Error('Could not prepare the selected image. Choose it again and retry.');

  const imageDataUri = `data:image/jpeg;base64,${result.base64}`;
  if (imageDataUri.length > MAX_PRODUCT_IMAGE_DATA_URI_LENGTH) {
    throw new Error('This photo is still too large after compression. Choose a simpler photo or use an image URL.');
  }
  return imageDataUri;
}

function clean(input: ProductInput): ProductInput {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    discountPercent: input.discountPercent,
    category: input.category,
    imageUrl: input.imageUrl.trim(),
    stock: Math.max(0, Math.floor(input.stock)),
  };
}

/** Admin only (enforced by Firestore rules). */
export async function createProduct(input: ProductInput): Promise<string> {
  const ref = await addDoc(collection(db, 'products'), {
    ...clean(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Admin only (enforced by Firestore rules). */
export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await updateDoc(doc(db, 'products', id), { ...clean(input), updatedAt: serverTimestamp() });
}

/** Admin only (enforced by Firestore rules). */
export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}
