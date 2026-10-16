import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Order } from '@/types';
import { formatDate, formatPrice, shortId } from '@/utils/format';
import { StatusBadge } from './StatusBadge';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onDelete?: () => void;
  showCustomer?: boolean;
}

export function OrderCard({ order, onPress, onDelete, showCustomer }: OrderCardProps) {
  const { colors } = useTheme();
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.content, { opacity: pressed ? 0.85 : 1 }]}>
        <View style={styles.top}>
          <Text style={[typography.h3, { color: colors.text }]}>Order #{shortId(order.id)}</Text>
          <StatusBadge status={order.status} />
        </View>
        {showCustomer ? (
          <Text style={[typography.small, { color: colors.textMuted }]}>
            {order.customerName || order.customerEmail}
          </Text>
        ) : null}
        <Text style={[typography.small, { color: colors.textMuted }]}>
          {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
        <View style={styles.bottom}>
          <Text style={[typography.h3, { color: colors.text }]}>{formatPrice(order.total)}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </Pressable>
      {onDelete ? <Button title="Delete" icon="trash-outline" variant="danger" small onPress={onDelete} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  content: { flex: 1, gap: 4 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
});
