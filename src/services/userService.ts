import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';

import type { UserProfile } from '@/types';
import { db } from './firebase';

function toDate(value: unknown): Date | null {
  return value && typeof (value as Timestamp).toDate === 'function' ? (value as Timestamp).toDate() : null;
}

export function mapUser(uid: string, data: DocumentData): UserProfile {
  return {
    uid,
    email: String(data.email ?? ''),
    displayName: String(data.displayName ?? ''),
    phone: String(data.phone ?? ''),
    address: String(data.address ?? ''),
    createdAt: toDate(data.createdAt),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? mapUser(snap.id, snap.data()) : null;
}

/** Creates users/{uid}. There is deliberately no role field: admin access comes from a Firebase custom claim. */
export async function createUserProfile(uid: string, email: string, displayName: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    email,
    displayName,
    phone: '',
    address: '',
    createdAt: serverTimestamp(),
  });
}

export async function updateUserProfile(
  uid: string,
  changes: { displayName: string; phone: string; address: string },
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    displayName: changes.displayName.trim(),
    phone: changes.phone.trim(),
    address: changes.address.trim(),
  });
}

/** Admin only (enforced by Firestore rules). */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .map((d) => mapUser(d.id, d.data()))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}
