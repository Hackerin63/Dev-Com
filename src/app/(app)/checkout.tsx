import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import RazorpayCheckout from 'react-native-razorpay';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { createOrder } from '@/services/orderService';
import { getPaymentSettings } from '@/services/paymentSettingsService';
import { createRazorpayPayment, verifyRazorpayPayment } from '@/services/razorpayPaymentService';
import { friendlyError } from '@/utils/errors';
import { formatPrice } from '@/utils/format';
import { validateAddress, validateName, validatePhone } from '@/utils/validation';

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const { user, profile, saveProfile } = useAuth();
  const { items, total, count, clear } = useCart();
  const loadPaymentSettings = useCallback(() => getPaymentSettings(), []);
  const { data: paymentSettings } = useAsyncData(loadPaymentSettings);

  // Fields start from the saved profile; once the customer types, their text wins.
  const [nameInput, setName] = useState<string | null>(null);
  const [phoneInput, setPhone] = useState<string | null>(null);
  const [addressInput, setAddress] = useState<string | null>(null);
  const name = nameInput ?? profile?.displayName ?? '';
  const phone = phoneInput ?? profile?.phone ?? '';
  const address = addressInput ?? profile?.address ?? '';
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI' | 'RAZORPAY'>('COD');

  if (items.length === 0 && !busy) {
    return (
      <Screen>
        <EmptyState
          icon="cart-outline"
          title="Nothing to check out"
          message="Your cart is empty."
          actionLabel="Browse products"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  async function placeOrder() {
    if (!user) return;
    const next = {
      name: validateName(name),
      phone: validatePhone(phone),
      address: validateAddress(address),
    };
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);
    try {
      let orderId: string;
      if (paymentMethod === 'RAZORPAY') {
        const intent = await createRazorpayPayment({
          customerName: name,
          phone,
          shippingAddress: address,
          items: items.map(({ productId, quantity }) => ({ productId, quantity })),
        });
        const result = await RazorpayCheckout.open({
          key: intent.keyId,
          amount: intent.amount,
          currency: intent.currency,
          name: 'Dev-Com',
          description: 'Payment for your order',
          order_id: intent.razorpayOrderId,
          prefill: { name, email: user.email ?? '', contact: phone },
          theme: { color: colors.primary },
        });
        if (!result.razorpay_payment_id || !result.razorpay_order_id || !result.razorpay_signature) {
          throw new Error('Razorpay did not return the details needed to verify this payment.');
        }
        await verifyRazorpayPayment({
          firebaseOrderId: intent.firebaseOrderId,
          razorpayOrderId: result.razorpay_order_id,
          razorpayPaymentId: result.razorpay_payment_id,
          razorpaySignature: result.razorpay_signature,
        });
        orderId = intent.firebaseOrderId;
      } else {
        orderId = await createOrder({
          userId: user.uid,
          customerName: name,
          customerEmail: user.email ?? '',
          phone,
          shippingAddress: address,
          items,
          paymentMethod,
          paymentUpiId: paymentMethod === 'UPI' ? paymentSettings?.upiId ?? '' : '',
        });
      }
      // Remember the delivery details for next time (best effort).
      if (!profile?.phone || !profile?.address) {
        saveProfile({ displayName: name, phone, address }).catch(() => {});
      }
      clear();
      router.replace(`/order/${orderId}`);
    } catch (e) {
      setFormError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <Screen scroll bottomInset>
      <Text style={[typography.h3, styles.section, { color: colors.text }]}>Delivery details</Text>
      <TextField label="Full name" value={name} onChangeText={setName} error={errors.name} autoComplete="name" maxLength={100} />
      <TextField
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={20}
        placeholder="10-digit mobile number"
      />
      <TextField
        label="Delivery address"
        value={address}
        onChangeText={setAddress}
        error={errors.address}
        multiline
        maxLength={500}
        placeholder="House number, street, city, PIN code"
      />

      <Text style={[typography.h3, styles.section, { color: colors.text }]}>Payment</Text>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: paymentMethod === 'COD' }}
        onPress={() => setPaymentMethod('COD')}
        style={[styles.payment, { backgroundColor: colors.surface, borderColor: paymentMethod === 'COD' ? colors.primary : colors.border }]}>
        <Ionicons name="cash-outline" size={24} color={paymentMethod === 'COD' ? colors.primary : colors.textMuted} />
        <View style={styles.flex}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>Cash on Delivery</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>Pay in cash when your order arrives.</Text>
        </View>
        <Ionicons name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'} size={22} color={paymentMethod === 'COD' ? colors.primary : colors.textMuted} />
      </Pressable>
      {paymentSettings?.upiId ? (
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: paymentMethod === 'UPI' }}
          onPress={() => setPaymentMethod('UPI')}
          style={[styles.payment, { backgroundColor: colors.surface, borderColor: paymentMethod === 'UPI' ? colors.primary : colors.border }]}>
          <Ionicons name="phone-portrait-outline" size={24} color={paymentMethod === 'UPI' ? colors.primary : colors.textMuted} />
          <View style={styles.flex}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>UPI</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>{paymentSettings.upiId}</Text>
          </View>
          <Ionicons name={paymentMethod === 'UPI' ? 'radio-button-on' : 'radio-button-off'} size={22} color={paymentMethod === 'UPI' ? colors.primary : colors.textMuted} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: paymentMethod === 'RAZORPAY' }}
        onPress={() => setPaymentMethod('RAZORPAY')}
        style={[styles.payment, { backgroundColor: colors.surface, borderColor: paymentMethod === 'RAZORPAY' ? colors.primary : colors.border }]}>
        <Ionicons name="card-outline" size={24} color={paymentMethod === 'RAZORPAY' ? colors.primary : colors.textMuted} />
        <View style={styles.flex}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>Razorpay · Test mode</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>Pay securely with card, UPI or netbanking.</Text>
        </View>
        <Ionicons name={paymentMethod === 'RAZORPAY' ? 'radio-button-on' : 'radio-button-off'} size={22} color={paymentMethod === 'RAZORPAY' ? colors.primary : colors.textMuted} />
      </Pressable>

      <Text style={[typography.h3, styles.section, { color: colors.text }]}>Order summary</Text>
      <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {items.map((item) => (
          <View key={item.productId} style={styles.line}>
            <Text numberOfLines={1} style={[typography.body, styles.flex, { color: colors.text }]}>
              {item.quantity} × {item.name}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>{formatPrice(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View style={[styles.line, styles.totalLine, { borderTopColor: colors.border }]}>
          <Text style={[typography.h3, { color: colors.text }]}>Total ({count})</Text>
          <Text style={[typography.h3, { color: colors.text }]}>{formatPrice(total)}</Text>
        </View>
      </View>

      {formError ? (
        <Text style={[typography.small, styles.formError, { color: colors.danger, backgroundColor: colors.dangerSoft }]}>
          {formError}
        </Text>
      ) : null}

      <Button
        title={paymentMethod === 'RAZORPAY' ? `Pay · ${formatPrice(total)}` : `Place order · ${formatPrice(total)}`}
        onPress={placeOrder}
        loading={busy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { marginBottom: spacing.md, marginTop: spacing.sm },
  payment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  summary: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  totalLine: { borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.xs },
  formError: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden' },
});
