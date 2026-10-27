import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { OrderCard } from '@/components/OrderCard';
import { Screen } from '@/components/Screen';
import { spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { deleteOrder, getUserOrders } from '@/services/orderService';
import type { Order } from '@/types';
import { friendlyError } from '@/utils/errors';
import { shortId } from '@/utils/format';

export default function OrdersScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const loader = useCallback(() => getUserOrders(uid), [uid]);
  const { data, loading, refreshing, error, reload, refresh } = useAsyncData(loader);

  function requestDelete(order: Order) {
    const paymentWarning = order.paymentMethod === 'UPI'
      ? '\n\nIf you already transferred money, contact the shop. Deleting does not reverse or refund a UPI payment.'
      : '';
    Alert.alert('Delete this order?', `Order #${shortId(order.id)} will be permanently removed.${paymentWarning}`, [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Delete order',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteOrder(order.id);
            await refresh();
          } catch (e) {
            Alert.alert('Could not delete the order', friendlyError(e));
          }
        },
      },
    ]);
  }

  if (loading && !data) return <LoadingView />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  return (
    <Screen topInset padded={false}>
      <FlatList
        data={data ?? []}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={[typography.h1, styles.title, { color: colors.text }]}>My orders</Text>}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No orders yet"
            message="When you place an order, you can follow it here."
            actionLabel="Start shopping"
            onAction={() => router.navigate('/')}
          />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => router.push(`/order/${item.id}`)}
            onDelete={
              item.status === 'pending' &&
              !item.stockDeducted &&
              item.paymentStatus !== 'paid' &&
              item.paymentMethod !== 'RAZORPAY'
                ? () => requestDelete(item)
                : undefined
            }
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  title: { marginBottom: spacing.lg },
});
