import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryChip } from '@/components/CategoryChip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { ProductGrid } from '@/components/ProductGrid';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { APP_NAME, CATEGORIES } from '@/constants/config';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getProducts } from '@/services/productService';

export default function HomeScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { profile, user } = useAuth();
  const { data, loading, refreshing, error, reload, refresh } = useAsyncData(getProducts);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const firstName = (profile?.displayName || user?.displayName || '').trim().split(' ')[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [data, query, category]);

  if (loading && !data) return <LoadingView message="Loading products…" />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  const header = (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={[typography.small, { color: colors.textMuted }]}>{APP_NAME}</Text>
          <Text style={[typography.h2, { color: colors.text }]}>{firstName ? `Hi, ${firstName}` : 'Welcome'}</Text>
        </View>
        <Pressable
          onPress={toggle}
          accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.text} />
        </Pressable>
      </View>

      <SearchBar value={query} onChangeText={setQuery} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} keyboardShouldPersistTaps="handled">
        <CategoryChip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <CategoryChip key={c} label={c} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
        ))}
      </ScrollView>

      {error ? (
        <Text style={[typography.small, { color: colors.danger }]}>Showing saved results. {error}</Text>
      ) : null}
    </View>
  );

  const empty =
    (data ?? []).length === 0 ? (
      <EmptyState
        icon="storefront-outline"
        title="No products yet"
        message="The catalogue is empty. An admin can add products from the admin dashboard."
      />
    ) : (
      <EmptyState
        icon="search-outline"
        title="No matches"
        message="Try a different search or pick another category."
        actionLabel="Clear filters"
        onAction={() => {
          setQuery('');
          setCategory(null);
        }}
      />
    );

  return (
    <Screen topInset padded={false}>
      <ProductGrid products={filtered} header={header} empty={empty} refreshing={refreshing} onRefresh={refresh} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexGrow: 0 },
});
