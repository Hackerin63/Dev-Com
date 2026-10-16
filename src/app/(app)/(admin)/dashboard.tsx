import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { OrderCard } from '@/components/OrderCard';
import { Screen } from '@/components/Screen';
import { StatCard } from '@/components/StatCard';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getAdminStats } from '@/services/adminService';
import { getAllOrders } from '@/services/orderService';

async function loadDashboard() {
  const [stats, orders] = await Promise.all([getAdminStats(), getAllOrders()]);
  return { stats, recent: orders.slice(0, 5) };
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { data, loading, refreshing, error, reload, refresh } = useAsyncData(loadDashboard);

  if (loading && !data) return <LoadingView />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <Screen scroll refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.grid}>
        <StatCard label="Products" value={data.stats.products} icon="cube-outline" />
        <StatCard label="Orders" value={data.stats.orders} icon="receipt-outline" />
        <StatCard label="Users" value={data.stats.users} icon="people-outline" />
        <StatCard label="Pending orders" value={data.stats.pendingOrders} icon="time-outline" />
      </View>

      <View style={styles.actions}>
        <Button title="Add product" icon="add" onPress={() => router.push('/product-form')} style={styles.flex} />
        <Button
          title="View orders"
          variant="secondary"
          onPress={() => router.navigate('/manage-orders')}
          style={styles.flex}
        />
      </View>

      <Text style={[typography.h3, styles.section, { color: colors.text }]}>Recent orders</Text>
      {data.recent.length === 0 ? (
        <Text style={[typography.body, { color: colors.textMuted }]}>No orders yet.</Text>
      ) : (
        data.recent.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            showCustomer
            onPress={() => router.navigate('/manage-orders')}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
});
