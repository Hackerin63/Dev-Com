import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { ProductImage } from '@/components/ProductImage';
import { radius, spacing, typography } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getProduct } from '@/services/productService';
import { formatPrice, getDiscountedPrice } from '@/utils/format';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { addItem, quantityOf } = useCart();
  const loader = useCallback(() => getProduct(String(id)), [id]);
  const { data: product, loading, error, reload } = useAsyncData(loader);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  if (loading && !product) return <LoadingView />;
  if (error && !product) return <ErrorView message={error} onRetry={reload} />;
  if (!product) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Product not found"
        message="It may have been removed."
        actionLabel="Back to shop"
        onAction={() => router.replace('/')}
      />
    );
  }

  const inCart = quantityOf(product.id);
  const soldOut = product.stock <= 0;
  const salePrice = getDiscountedPrice(product.price, product.discountPercent);

  function add() {
    if (!product) return;
    const result = addItem(product, 1);
    setNotice({ ok: result.ok, text: result.ok ? 'Added to your cart.' : (result.message ?? 'Could not add this item.') });
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ProductImage uri={product.imageUrl} style={styles.image} iconSize={64} />
        <View style={styles.meta}>
          <Text style={[typography.small, { color: colors.primary, fontWeight: '700' }]}>{product.category}</Text>
          <Text style={[typography.h1, { color: colors.text }]}>{product.name}</Text>
          <View style={styles.priceRow}>
            <View style={styles.prices}>
              <Text style={[typography.h2, { color: colors.text }]}>{formatPrice(salePrice)}</Text>
              {product.discountPercent > 0 ? (
                <>
                  <Text style={[typography.body, styles.originalPrice, { color: colors.textMuted }]}>
                    {formatPrice(product.price)}
                  </Text>
                  <Text style={[typography.small, { color: colors.success, fontWeight: '700' }]}>
                    {product.discountPercent}% off
                  </Text>
                </>
              ) : null}
            </View>
            <View
              style={[
                styles.stock,
                { backgroundColor: soldOut ? colors.dangerSoft : product.stock <= 5 ? colors.warningSoft : colors.successSoft },
              ]}>
              <Text
                style={[
                  typography.caption,
                  {
                    fontWeight: '700',
                    color: soldOut ? colors.danger : product.stock <= 5 ? colors.warning : colors.success,
                  },
                ]}>
                {soldOut ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : `${product.stock} in stock`}
              </Text>
            </View>
          </View>
          <Text style={[typography.h3, styles.sectionTitle, { color: colors.text }]}>About this product</Text>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            {product.description || 'No description has been added for this product yet.'}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {notice ? (
          <Text style={[typography.small, styles.notice, { color: notice.ok ? colors.success : colors.danger }]}>
            {notice.text}
          </Text>
        ) : inCart > 0 ? (
          <Text style={[typography.small, styles.notice, { color: colors.textMuted }]}>{inCart} in your cart</Text>
        ) : null}
        <View style={styles.actions}>
          <Button
            title={soldOut ? 'Out of stock' : 'Add to cart'}
            icon="cart-outline"
            onPress={add}
            disabled={soldOut}
            style={styles.flex}
          />
          {inCart > 0 ? (
            <Button title="View cart" variant="secondary" onPress={() => router.navigate('/cart')} />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  image: { width: '100%', aspectRatio: 1, borderRadius: radius.lg },
  meta: { marginTop: spacing.lg, gap: spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  prices: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  originalPrice: { textDecorationLine: 'line-through' },
  stock: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.xs },
  bar: { padding: spacing.lg, borderTopWidth: 1, gap: spacing.sm },
  notice: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md },
});
