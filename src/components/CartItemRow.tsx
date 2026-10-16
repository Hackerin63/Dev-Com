import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MAX_CART_QTY_PER_ITEM } from '@/constants/config';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { CartItem } from '@/types';
import { formatPrice } from '@/utils/format';
import { ProductImage } from './ProductImage';
import { QuantityStepper } from './QuantityStepper';

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (next: number) => void;
  onRemove: () => void;
  onPress: () => void;
}

export function CartItemRow({ item, onQuantityChange, onRemove, onPress }: CartItemRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={onPress} accessibilityLabel={`Open ${item.name}`}>
        <ProductImage uri={item.imageUrl} style={styles.image} iconSize={26} />
      </Pressable>
      <View style={styles.info}>
        <Text numberOfLines={2} style={[typography.bodyStrong, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[typography.small, { color: colors.textMuted }]}>{formatPrice(item.price)} each</Text>
        <View style={styles.bottom}>
          <QuantityStepper
            value={item.quantity}
            max={Math.min(item.stock, MAX_CART_QTY_PER_ITEM)}
            onChange={onQuantityChange}
          />
          <Text style={[typography.h3, { color: colors.text }]}>{formatPrice(item.price * item.quantity)}</Text>
        </View>
      </View>
      <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${item.name}`} style={styles.remove}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  image: { width: 80, height: 80 },
  info: { flex: 1, gap: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  remove: { alignSelf: 'flex-start', padding: 2 },
});
