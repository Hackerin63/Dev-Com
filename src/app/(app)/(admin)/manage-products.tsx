import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { ProductImage } from '@/components/ProductImage';
import { Screen } from '@/components/Screen';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { deleteProduct, getProducts } from '@/services/productService';
import type { Product } from '@/types';
import { friendlyError } from '@/utils/errors';
import { formatPrice, getDiscountedPrice } from '@/utils/format';

export default function ManageProductsScreen() {
  const { colors } = useTheme();
  const { data, loading, refreshing, error, reload, refresh } = useAsyncData(getProducts);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function confirmDelete(product: Product) {
    Alert.alert('Delete product?', `"${product.name}" will be removed from the shop. This cannot be undone.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(product.id);
          try {
            await deleteProduct(product.id);
            await refresh();
          } catch (e) {
            Alert.alert('Could not delete the product', friendlyError(e));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }

  if (loading && !data) return <LoadingView />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  return (
    <Screen padded={false}>
      <FlatList
        data={data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Button title="Add product" icon="add" onPress={() => router.push('/product-form')} style={styles.add} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title="No products yet"
            message="Add your first product to start selling."
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ProductImage uri={item.imageUrl} style={styles.thumb} iconSize={24} />
            <View style={styles.info}>
              <Text numberOfLines={2} style={[typography.bodyStrong, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {item.category} · {formatPrice(getDiscountedPrice(item.price, item.discountPercent))}
                {item.discountPercent > 0 ? ` (${item.discountPercent}% off)` : ''}
              </Text>
              <Text
                style={[
                  typography.small,
                  { color: item.stock <= 0 ? colors.danger : item.stock <= 5 ? colors.warning : colors.textMuted },
                ]}>
                {item.stock <= 0 ? 'Out of stock' : `${item.stock} in stock`}
              </Text>
              <View style={styles.buttons}>
                <Button
                  title="Edit"
                  variant="secondary"
                  small
                  icon="create-outline"
                  onPress={() => router.push({ pathname: '/product-form', params: { id: item.id } })}
                />
                <Button
                  title="Delete"
                  variant="danger"
                  small
                  icon="trash-outline"
                  loading={deletingId === item.id}
                  onPress={() => confirmDelete(item)}
                />
              </View>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  add: { marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  thumb: { width: 84, height: 84 },
  info: { flex: 1, gap: 2 },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
