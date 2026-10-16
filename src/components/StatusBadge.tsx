import { StyleSheet, Text, View } from 'react-native';

import { STATUS_LABELS } from '@/constants/config';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { OrderStatus } from '@/types';

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { colors } = useTheme();
  const tone = {
    pending: { bg: colors.warningSoft, fg: colors.warning },
    confirmed: { bg: colors.primarySoft, fg: colors.primary },
    shipped: { bg: colors.primarySoft, fg: colors.primary },
    delivered: { bg: colors.successSoft, fg: colors.success },
    cancelled: { bg: colors.dangerSoft, fg: colors.danger },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[typography.caption, { color: tone.fg, fontWeight: '700' }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
});
