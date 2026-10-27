import { createHmac, timingSafeEqual } from 'node:crypto';

import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Razorpay from 'razorpay';

initializeApp();

const db = getFirestore();
const REGION = 'asia-south1';
const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET');
const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET');

interface CartEntry {
  productId: string;
  quantity: number;
}

interface CreatePaymentInput {
  customerName: string;
  phone: string;
  shippingAddress: string;
  items: CartEntry[];
}

function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'Invalid request data.');
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, field: string, minLength: number, maxLength: number): string {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `Invalid ${field}.`);
  const text = value.trim();
  if (text.length < minLength || text.length > maxLength) {
    throw new HttpsError('invalid-argument', `Invalid ${field}.`);
  }
  return text;
}

function createRazorpayClient(): Razorpay {
  const keyId = RAZORPAY_KEY_ID.value();
  const keySecret = RAZORPAY_KEY_SECRET.value();
  if (!keyId.startsWith('rzp_test_') || !keySecret) {
    throw new HttpsError(
      'failed-precondition',
      'Razorpay test credentials are not configured. Configure test-mode keys in Firebase Functions secrets.',
    );
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function parseCreatePaymentInput(value: unknown): CreatePaymentInput {
  const data = objectInput(value);
  const customerName = requiredText(data.customerName, 'customer name', 2, 100);
  const phone = requiredText(data.phone, 'phone number', 7, 20);
  const shippingAddress = requiredText(data.shippingAddress, 'delivery address', 10, 500);
  if (!Array.isArray(data.items) || data.items.length === 0 || data.items.length > 50) {
    throw new HttpsError('invalid-argument', 'Your cart is empty or has too many items.');
  }

  const seen = new Set<string>();
  const items = data.items.map((value): CartEntry => {
    const item = objectInput(value);
    const productId = requiredText(item.productId, 'product', 1, 100);
    if (productId.includes('/') || seen.has(productId)) {
      throw new HttpsError('invalid-argument', 'The cart contains an invalid or duplicate product.');
    }
    seen.add(productId);
    if (!Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 20) {
      throw new HttpsError('invalid-argument', 'Invalid item quantity.');
    }
    return { productId, quantity: Number(item.quantity) };
  });

  return { customerName, phone, shippingAddress, items };
}

function validSignature(expected: string, supplied: unknown): supplied is string {
  if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expectedBuffer = Buffer.from(expected, 'hex');
  const suppliedBuffer = Buffer.from(supplied, 'hex');
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export const createRazorpayPayment = onCall(
  { region: REGION, secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], maxInstances: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in before paying.');
    const input = parseCreatePaymentInput(request.data);
    const razorpay = createRazorpayClient();
    const productSnapshots = await Promise.all(
      input.items.map(({ productId }) => db.collection('products').doc(productId).get()),
    );

    const items = input.items.map((cartItem, index) => {
      const snapshot = productSnapshots[index];
      if (!snapshot.exists) {
        throw new HttpsError('failed-precondition', 'A product in your cart is no longer available.');
      }
      const product = snapshot.data();
      const stock = Number(product?.stock);
      const price = Number(product?.price);
      const discountPercent = Number(product?.discountPercent ?? 0);
      if (!Number.isFinite(stock) || stock < cartItem.quantity) {
        throw new HttpsError('failed-precondition', `There is not enough stock for "${String(product?.name ?? 'an item')}".`);
      }
      if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
        throw new HttpsError('failed-precondition', 'A product in your cart has invalid pricing.');
      }
      const unitPrice = Math.round(price * (1 - discountPercent / 100) * 100) / 100;
      return {
        productId: snapshot.id,
        name: String(product?.name ?? ''),
        price: unitPrice,
        quantity: cartItem.quantity,
        imageUrl: String(product?.imageUrl ?? '').startsWith('data:image/') ? '' : String(product?.imageUrl ?? ''),
      };
    });

    const amountPaise = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
      throw new HttpsError('failed-precondition', 'The order total must be at least ₹1.00.');
    }

    const userEmail = typeof request.auth.token.email === 'string' ? request.auth.token.email : '';
    const orderRef = db.collection('orders').doc();
    const gatewayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: orderRef.id,
      notes: { firebaseOrderId: orderRef.id, userId: request.auth.uid },
    });

    await orderRef.create({
      userId: request.auth.uid,
      customerName: input.customerName,
      customerEmail: userEmail,
      items,
      total: amountPaise / 100,
      status: 'pending',
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'pending',
      paymentUpiId: '',
      razorpayOrderId: gatewayOrder.id,
      razorpayPaymentId: '',
      shippingAddress: input.shippingAddress,
      phone: input.phone,
      stockDeducted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      firebaseOrderId: orderRef.id,
      razorpayOrderId: gatewayOrder.id,
      keyId: RAZORPAY_KEY_ID.value(),
      amount: amountPaise,
      currency: 'INR',
    };
  },
);

export const verifyRazorpayPayment = onCall(
  { region: REGION, secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], maxInstances: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in before verifying payment.');
    const data = objectInput(request.data);
    const firebaseOrderId = requiredText(data.firebaseOrderId, 'order', 1, 100);
    const razorpayOrderId = requiredText(data.razorpayOrderId, 'payment order', 1, 100);
    const paymentId = requiredText(data.razorpayPaymentId, 'payment', 1, 100);
    const razorpay = createRazorpayClient();
    const expectedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET.value())
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest('hex');

    if (!validSignature(expectedSignature, data.razorpaySignature)) {
      throw new HttpsError('permission-denied', 'The payment signature could not be verified.');
    }

    const orderRef = db.collection('orders').doc(firebaseOrderId);
    const orderSnapshot = await orderRef.get();
    if (!orderSnapshot.exists) throw new HttpsError('not-found', 'The order could not be found.');
    const initialOrder = orderSnapshot.data();
    if (
      initialOrder?.userId !== request.auth.uid ||
      initialOrder?.paymentMethod !== 'RAZORPAY' ||
      initialOrder?.razorpayOrderId !== razorpayOrderId
    ) {
      throw new HttpsError('permission-denied', 'This payment does not belong to your order.');
    }
    if (initialOrder.paymentStatus === 'paid' && initialOrder.razorpayPaymentId === paymentId) {
      return { verified: true };
    }
    if (initialOrder.status !== 'pending' || initialOrder.paymentStatus !== 'pending') {
      throw new HttpsError('failed-precondition', 'This order is no longer awaiting payment.');
    }

    let payment = await razorpay.payments.fetch(paymentId);
    if (
      payment.order_id !== razorpayOrderId ||
      payment.currency !== 'INR' ||
      Number(payment.amount) !== Math.round(Number(initialOrder.total) * 100)
    ) {
      throw new HttpsError('failed-precondition', 'The payment details do not match this order.');
    }
    if (payment.status === 'authorized') {
      payment = await razorpay.payments.capture(paymentId, payment.amount, 'INR');
    }
    if (
      payment.order_id !== razorpayOrderId ||
      payment.status !== 'captured' ||
      payment.currency !== 'INR'
    ) {
      throw new HttpsError('failed-precondition', 'Razorpay has not confirmed a captured payment for this order.');
    }

    await db.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) throw new HttpsError('not-found', 'The order could not be found.');
      const order = orderSnapshot.data();
      if (order?.userId !== request.auth?.uid || order?.paymentMethod !== 'RAZORPAY' || order?.razorpayOrderId !== razorpayOrderId) {
        throw new HttpsError('permission-denied', 'This payment does not belong to your order.');
      }
      if (Number(payment.amount) !== Math.round(Number(order.total) * 100)) {
        throw new HttpsError('failed-precondition', 'The captured amount does not match the order total.');
      }
      if (order.paymentStatus === 'paid') {
        if (order.razorpayPaymentId !== paymentId) {
          throw new HttpsError('already-exists', 'A different payment was already recorded for this order.');
        }
        return;
      }
      if (order.status !== 'pending') {
        throw new HttpsError('failed-precondition', 'This order is no longer awaiting payment.');
      }
      transaction.update(orderRef, {
        paymentStatus: 'paid',
        razorpayPaymentId: paymentId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return { verified: true };
  },
);

export const razorpayWebhook = onRequest(
  { region: REGION, secrets: [RAZORPAY_WEBHOOK_SECRET], maxInstances: 10 },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method not allowed.');
      return;
    }
    const suppliedSignature = request.header('x-razorpay-signature');
    const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET.value())
      .update(request.rawBody)
      .digest('hex');
    if (!validSignature(expectedSignature, suppliedSignature)) {
      response.status(401).send('Invalid webhook signature.');
      return;
    }

    const body = objectInput(request.body);
    if (body.event !== 'payment.captured') {
      response.status(200).send('Event ignored.');
      return;
    }
    const payload = objectInput(body.payload);
    const paymentPayload = objectInput(payload.payment);
    const payment = objectInput(paymentPayload.entity);
    const razorpayOrderId = requiredText(payment.order_id, 'payment order', 1, 100);
    const paymentId = requiredText(payment.id, 'payment', 1, 100);
    if (payment.status !== 'captured' || payment.currency !== 'INR' || !Number.isInteger(payment.amount)) {
      response.status(400).send('Invalid captured payment.');
      return;
    }

    const matches = await db.collection('orders').where('razorpayOrderId', '==', razorpayOrderId).limit(1).get();
    if (matches.empty) {
      response.status(404).send('Order not found.');
      return;
    }
    const orderRef = matches.docs[0].ref;
    await db.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) return;
      const order = orderSnapshot.data();
      if (order?.paymentMethod !== 'RAZORPAY' || Number(payment.amount) !== Math.round(Number(order.total) * 100)) {
        throw new Error('Captured payment does not match its order.');
      }
      if (order.paymentStatus === 'paid') {
        if (order.razorpayPaymentId !== paymentId) throw new Error('A different payment was recorded for this order.');
        return;
      }
      transaction.update(orderRef, {
        paymentStatus: 'paid',
        razorpayPaymentId: paymentId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    response.status(200).send('Payment recorded.');
  },
);
