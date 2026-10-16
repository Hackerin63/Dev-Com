import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { Screen } from '@/components/Screen';
import { CATEGORIES, CATEGORY_ICONS } from '@/constants/config';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getProducts } from '@/services/productService';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { data, loading, refreshing, error, reload, refresh } = useAsyncData(getProducts);

  if (loading && !data) return <LoadingView />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  const counts = new Map<string, number>();
  (data ?? []).forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));

  return (
    <Screen scroll topInset refreshing={refreshing} onRefresh={refresh}>
      <Text style={[typography.h1, styles.title, { color: colors.text }]}>Categories</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((name) => {
          const count = counts.get(name) ?? 0;
          return (
            <Pressable
              key={name}
              onPress={() => router.push(`/category/${encodeURIComponent(name)}`)}
              accessibilityRole="button"
              accessibilityLabel={`${name}, ${count} products`}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}>
              <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons
                  name={(CATEGORY_ICONS[name] ?? 'pricetag-outline') as keyof typeof Ionicons.glyphMap}
                  size={26}
                  color={colors.primary}
                />
              </View>
              <Text style={[typography.h3, { color: colors.text }]}>{name}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {count} {count === 1 ? 'product' : 'products'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 2,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});
