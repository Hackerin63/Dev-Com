import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[typography.h1, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.small, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: '45%', borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: 2 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});
