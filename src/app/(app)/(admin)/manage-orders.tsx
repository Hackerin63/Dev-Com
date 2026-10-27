import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CategoryChip } from '@/components/CategoryChip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { NEXT_STATUS, ORDER_STATUSES, STATUS_LABELS } from '@/constants/config';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { deleteOrder, getAllOrders, markOrderPaid, updateOrderStatus } from '@/services/orderService';
import type { Order, OrderStatus } from '@/types';
import { friendlyError } from '@/utils/errors';
import { formatDateTime, formatPrice, shortId } from '@/utils/format';

export default function ManageOrdersScreen() {
  const { colors } = useTheme();
  const { data, loading, refreshing, error, reload, refresh } = useAsyncData(getAllOrders);
  const [filter, setFilter] = useState<OrderStatus | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const orders = useMemo(
    () => (data ?? []).filter((o) => (filter ? o.status === filter : true)),
    [data, filter],
  );

  async function change(order: Order, next: OrderStatus) {
    setBusyId(order.id);
    try {
      await updateOrderStatus(order, next);
      await refresh();
    } catch (e) {
      Alert.alert('Could not update the order', friendlyError(e));
    } finally {
      setBusyId(null);
    }
  }

  function requestChange(order: Order, next: OrderStatus) {
    if (next === 'cancelled') {
      Alert.alert('Cancel this order?', `Order #${shortId(order.id)} will be marked as cancelled.`, [
        { text: 'Keep order', style: 'cancel' },
        { text: 'Cancel order', style: 'destructive', onPress: () => change(order, next) },
      ]);
    } else {
      change(order, next);
    }
  }

  function requestDelete(order: Order) {
    Alert.alert(
      'Delete this order?',
      `Order #${shortId(order.id)} will be permanently removed from order history. This cannot be undone.`,
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Delete order',
          style: 'destructive',
          onPress: async () => {
            setBusyId(order.id);
            try {
              await deleteOrder(order.id);
              setOpenId(null);
              await refresh();
            } catch (e) {
              Alert.alert('Could not delete the order', friendlyError(e));
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  }

  if (loading && !data) return <LoadingView />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  return (
    <Screen padded={false}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            <CategoryChip label="All" selected={filter === null} onPress={() => setFilter(null)} />
            {ORDER_STATUSES.map((s) => (
              <CategoryChip key={s} label={STATUS_LABELS[s]} selected={filter === s} onPress={() => setFilter(filter === s ? null : s)} />
            ))}
          </ScrollView>
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No orders here"
            message={filter ? 'No orders have this status.' : 'Orders will appear when customers place them.'}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        renderItem={({ item: order }) => {
          const open = openId === order.id;
          const nextOptions = NEXT_STATUS[order.status].filter(
            (next) => !(next === 'confirmed' && order.paymentMethod !== 'COD' && order.paymentStatus !== 'paid'),
          );
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Pressable onPress={() => setOpenId(open ? null : order.id)} accessibilityRole="button" style={styles.head}>
                <View style={styles.flex}>
                  <View style={styles.row}>
                    <Text style={[typography.h3, { color: colors.text }]}>#{shortId(order.id)}</Text>
                    <StatusBadge status={order.status} />
                  </View>
                  <Text style={[typography.small, { color: colors.textMuted }]}>
                    {order.customerName || order.customerEmail} · {formatDateTime(order.createdAt)}
                  </Text>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>{formatPrice(order.total)}</Text>
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
              </Pressable>

              {open ? (
                <View style={[styles.details, { borderTopColor: colors.border }]}>
                  {order.items.map((item) => (
                    <Text key={item.productId} style={[typography.body, { color: colors.text }]}>
                      {item.quantity} × {item.name} — {formatPrice(item.price * item.quantity)}
                    </Text>
                  ))}
                  <Text style={[typography.bodyStrong, styles.gap, { color: colors.text }]}>Payment: {order.paymentMethod}</Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>
                    {order.paymentMethod === 'UPI'
                      ? order.paymentStatus === 'paid'
                        ? 'UPI payment verified'
                        : `Awaiting payment verification · ${order.paymentUpiId}`
                      : order.paymentMethod === 'RAZORPAY'
                        ? order.paymentStatus === 'paid'
                          ? `Razorpay payment verified · ${order.razorpayPaymentId ?? ''}`
                          : 'Awaiting Razorpay test payment'
                        : 'Pay on delivery'}
                  </Text>
                  {order.paymentMethod === 'UPI' && order.paymentStatus === 'pending' && order.status === 'pending' ? (
                    <Button
                      title="Mark payment received"
                      icon="checkmark-circle-outline"
                      variant="secondary"
                      small
                      loading={busyId === order.id}
                      disabled={busyId !== null && busyId !== order.id}
                      onPress={async () => {
                        setBusyId(order.id);
                        try {
                          await markOrderPaid(order.id);
                          await refresh();
                        } catch (e) {
                          Alert.alert('Could not confirm payment', friendlyError(e));
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    />
                  ) : null}
                  <Text style={[typography.small, styles.gap, { color: colors.textMuted }]}>Deliver to</Text>
                  <Text style={[typography.body, { color: colors.text }]}>{order.customerName}</Text>
                  <Text style={[typography.body, { color: colors.text }]}>{order.phone}</Text>
                  <Text style={[typography.body, { color: colors.text }]}>{order.shippingAddress}</Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>{order.customerEmail}</Text>

                  {nextOptions.length > 0 ? (
                    <View style={styles.actions}>
                      {nextOptions.map((next) => (
                        <Button
                          key={next}
                          title={next === 'cancelled' ? 'Cancel order' : `Mark ${STATUS_LABELS[next].toLowerCase()}`}
                          variant={next === 'cancelled' ? 'danger' : 'primary'}
                          small
                          loading={busyId === order.id}
                          disabled={busyId !== null && busyId !== order.id}
                          onPress={() => requestChange(order, next)}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={[typography.small, styles.gap, { color: colors.textMuted }]}>
                      This order is closed. Its status can no longer change.
                    </Text>
                  )}
                  {order.paymentMethod !== 'RAZORPAY' ? (
                    <Button
                      title="Delete order"
                      icon="trash-outline"
                      variant="danger"
                      small
                      loading={busyId === order.id}
                      disabled={busyId !== null && busyId !== order.id}
                      onPress={() => requestDelete(order)}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, flexGrow: 1 },
  chips: { flexGrow: 0, marginBottom: spacing.lg },
  card: { borderWidth: 1, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  details: { borderTopWidth: 1, padding: spacing.lg, gap: 4 },
  gap: { marginTop: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
});
