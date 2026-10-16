import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={[typography.h3, styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[typography.body, styles.message, { color: colors.textMuted }]}>{message}</Text> : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, flex: 1 },
  badge: { width: 76, height: 76, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: spacing.lg, textAlign: 'center' },
  message: { marginTop: spacing.xs, textAlign: 'center', maxWidth: 300 },
  action: { marginTop: spacing.xl },
});
