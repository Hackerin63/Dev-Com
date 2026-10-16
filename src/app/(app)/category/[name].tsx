import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { ProductGrid } from '@/components/ProductGrid';
import { Screen } from '@/components/Screen';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getProducts } from '@/services/productService';

export default function CategoryScreen() {
  const params = useLocalSearchParams<{ name: string }>();
  const name = decodeURIComponent(String(params.name ?? ''));
  const { data, loading, refreshing, error, reload, refresh } = useAsyncData(getProducts);
  const products = useMemo(() => (data ?? []).filter((p) => p.category === name), [data, name]);

  return (
    <Screen padded={false} bottomInset>
      <Stack.Screen options={{ title: name || 'Category' }} />
      {loading && !data ? (
        <LoadingView />
      ) : error && !data ? (
        <ErrorView message={error} onRetry={reload} />
      ) : (
        <ProductGrid
          products={products}
          refreshing={refreshing}
          onRefresh={refresh}
          empty={<EmptyState icon="pricetag-outline" title={`No ${name} products yet`} message="Check back soon." />}
        />
      )}
    </Screen>
  );
}
