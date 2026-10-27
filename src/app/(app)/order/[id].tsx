import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { ProductImage } from '@/components/ProductImage';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getOrder } from '@/services/orderService';
import { formatDateTime, formatPrice, shortId } from '@/utils/format';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [openingPayment, setOpeningPayment] = useState(false);
  const loader = useCallback(() => getOrder(String(id)), [id]);
  const { data: order, loading, refreshing, error, reload, refresh } = useAsyncData(loader);

  if (loading && !order) return <LoadingView />;
  if (error && !order) return <ErrorView message={error} onRetry={reload} />;
  if (!order) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Order not found"
        actionLabel="Go to my orders"
        onAction={() => router.replace('/orders')}
      />
    );
  }

  async function payWithUpi(orderToPay: NonNullable<typeof order>) {
    const params = [
      `pa=${encodeURIComponent(orderToPay.paymentUpiId)}`,
      `pn=${encodeURIComponent('Dev-Com')}`,
      `am=${orderToPay.total.toFixed(2)}`,
      'cu=INR',
      `tn=${encodeURIComponent(`Order ${shortId(orderToPay.id)}`)}`,
      `tr=${encodeURIComponent(orderToPay.id)}`,
    ].join('&');
    setOpeningPayment(true);
    try {
      await Linking.openURL(`upi://pay?${params}`);
    } catch {
      Alert.alert('Could not open a UPI app', `Pay ${formatPrice(orderToPay.total)} to ${orderToPay.paymentUpiId} using your UPI app.`);
    } finally {
      setOpeningPayment(false);
    }
  }

  return (
    <Screen scroll bottomInset refreshing={refreshing} onRefresh={refresh}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Text style={[typography.h2, { color: colors.text }]}>Order #{shortId(order.id)}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={[typography.small, { color: colors.textMuted }]}>Placed {formatDateTime(order.createdAt)}</Text>
        {order.status === 'pending' ? (
          <Text style={[typography.small, { color: colors.textMuted }]}>
            Thanks! We will confirm your order shortly.
          </Text>
        ) : null}
      </View>

      <Text style={[typography.h3, styles.section, { color: colors.text }]}>Items</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {order.items.map((item) => (
          <View key={item.productId} style={styles.item}>
            <ProductImage uri={item.imageUrl} style={styles.thumb} iconSize={20} />
            <View style={styles.flex}>
              <Text numberOfLines={2} style={[typography.bodyStrong, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {item.quantity} × {formatPrice(item.price)}
              </Text>
            </View>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{formatPrice(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View style={[styles.row, styles.total, { borderTopColor: colors.border }]}>
          <Text style={[typography.h3, { color: colors.text }]}>Total</Text>
          <Text style={[typography.h3, { color: colors.text }]}>{formatPrice(order.total)}</Text>
        </View>
      </View>

      <Text style={[typography.h3, styles.section, { color: colors.text }]}>Delivery</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{order.customerName}</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>{order.phone}</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>{order.shippingAddress}</Text>
      </View>

      <Text style={[typography.h3, styles.section, { color: colors.text }]}>Payment</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {order.paymentMethod === 'UPI' ? (
          <>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>UPI · {order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting verification'}</Text>
            <Text selectable style={[typography.body, { color: colors.textMuted }]}>Pay {formatPrice(order.total)} to {order.paymentUpiId}</Text>
            {order.paymentStatus === 'pending' && order.status === 'pending' ? (
              <>
                <Button title="Pay with UPI" icon="open-outline" onPress={() => payWithUpi(order)} loading={openingPayment} />
                <Text style={[typography.small, { color: colors.textMuted }]}>
                  The app cannot confirm payments automatically. The shop will verify your transfer; do not pay again while it is pending.
                </Text>
              </>
            ) : null}
          </>
        ) : order.paymentMethod === 'RAZORPAY' ? (
          <>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              Razorpay test payment · {order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting payment'}
            </Text>
            {order.razorpayPaymentId ? (
              <Text selectable style={[typography.small, { color: colors.textMuted }]}>
                Payment reference: {order.razorpayPaymentId}
              </Text>
            ) : null}
            {order.paymentStatus !== 'paid' ? (
              <Text style={[typography.small, { color: colors.textMuted }]}>
                Payment has not been verified. If you completed checkout, refresh this order or contact the shop before paying again.
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>Cash on Delivery</Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>Pay {formatPrice(order.total)} in cash when your order arrives.</Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  thumb: { width: 52, height: 52 },
  total: { borderTopWidth: 1, paddingTop: spacing.md },
});
