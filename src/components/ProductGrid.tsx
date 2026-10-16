import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';

import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  header?: ReactElement;
  empty?: ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ProductGrid({ products, header, empty, refreshing, onRefresh }: ProductGridProps) {
  const { colors } = useTheme();
  return (
    <FlatList
      data={products}
      numColumns={2}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
        </View>
      )}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  row: { gap: spacing.md },
  cell: { flex: 1, marginBottom: spacing.md, maxWidth: '50%' },
});
