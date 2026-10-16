import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { Screen } from '@/components/Screen';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getAllUsers } from '@/services/userService';
import { formatDate } from '@/utils/format';

export default function ManageUsersScreen() {
  const { colors } = useTheme();
  const { data, loading, refreshing, error, reload, refresh } = useAsyncData(getAllUsers);

  if (loading && !data) return <LoadingView />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  return (
    <Screen padded={false}>
      <FlatList
        data={data ?? []}
        keyExtractor={(u) => u.uid}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[typography.small, styles.count, { color: colors.textMuted }]}>
            {(data ?? []).length} registered {(data ?? []).length === 1 ? 'user' : 'users'}
          </Text>
        }
        ListEmptyComponent={<EmptyState icon="people-outline" title="No users yet" />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
              <Text style={[typography.h3, { color: colors.primary }]}>
                {(item.displayName || item.email || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.info}>
              <Text numberOfLines={1} style={[typography.bodyStrong, { color: colors.text }]}>
                {item.displayName || 'Unnamed user'}
              </Text>
              <Text numberOfLines={1} style={[typography.small, { color: colors.textMuted }]}>
                {item.email}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {item.phone ? `${item.phone} · ` : ''}Joined {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  count: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: { width: 46, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 1 },
});
