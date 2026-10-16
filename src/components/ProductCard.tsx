import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Product } from '@/types';
import { formatPrice, getDiscountedPrice } from '@/utils/format';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { colors } = useTheme();
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= 5;
  const salePrice = getDiscountedPrice(product.price, product.discountPercent);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatPrice(product.price)}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}>
      <ProductImage uri={product.imageUrl} style={styles.image} />
      <View style={styles.body}>
        <Text numberOfLines={1} style={[typography.small, { color: colors.textMuted }]}>
          {product.category}
        </Text>
        <Text numberOfLines={2} style={[typography.bodyStrong, styles.name, { color: colors.text }]}>
          {product.name}
        </Text>
        <View style={styles.footer}>
          <View style={styles.prices}>
            <Text style={[typography.h3, { color: colors.text }]}>{formatPrice(salePrice)}</Text>
            {product.discountPercent > 0 ? (
              <Text style={[typography.caption, styles.originalPrice, { color: colors.textMuted }]}>
                {formatPrice(product.price)}
              </Text>
            ) : null}
          </View>
          {product.discountPercent > 0 ? (
            <Text style={[typography.caption, { color: colors.success, fontWeight: '700' }]}>
              {product.discountPercent}% off
            </Text>
          ) : null}
          {soldOut ? (
            <Text style={[typography.caption, { color: colors.danger, fontWeight: '700' }]}>Sold out</Text>
          ) : low ? (
            <Text style={[typography.caption, { color: colors.warning, fontWeight: '700' }]}>{product.stock} left</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1, borderRadius: 0 },
  body: { padding: spacing.md },
  name: { marginTop: 2, minHeight: 44 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  prices: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  originalPrice: { textDecorationLine: 'line-through' },
});
