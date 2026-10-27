import { httpsCallable } from 'firebase/functions';

import type { CartItem } from '@/types';
import { functions } from './firebase';

interface CreatePaymentInput {
  customerName: string;
  phone: string;
  shippingAddress: string;
  items: Pick<CartItem, 'productId' | 'quantity'>[];
}

export interface RazorpayPaymentIntent {
  firebaseOrderId: string;
  razorpayOrderId: string;
  keyId: string;
  amount: number;
  currency: 'INR';
}

interface VerifyPaymentInput {
  firebaseOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function createRazorpayPayment(input: CreatePaymentInput): Promise<RazorpayPaymentIntent> {
  const callable = httpsCallable<CreatePaymentInput, RazorpayPaymentIntent>(functions, 'createRazorpayPayment');
  return (await callable(input)).data;
}

export async function verifyRazorpayPayment(input: VerifyPaymentInput): Promise<void> {
  const callable = httpsCallable<VerifyPaymentInput, { verified: boolean }>(functions, 'verifyRazorpayPayment');
  const result = await callable(input);
  if (!result.data.verified) throw new Error('The payment could not be verified. Please contact the shop before trying again.');
}
