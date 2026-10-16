import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from './firebase';

const paymentSettingsRef = doc(db, 'settings', 'payment');

export interface PaymentSettings {
  upiId: string;
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const snapshot = await getDoc(paymentSettingsRef);
  return { upiId: snapshot.exists() ? String(snapshot.data().upiId ?? '') : '' };
}

export async function saveUpiId(upiId: string): Promise<void> {
  await setDoc(paymentSettingsRef, { upiId: upiId.trim(), updatedAt: serverTimestamp() });
}