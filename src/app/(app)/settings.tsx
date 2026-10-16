import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { APP_NAME } from '@/constants/config';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';

const OPTIONS: { mode: ThemeMode; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'light', label: 'Light', hint: 'Bright backgrounds', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', hint: 'Easier on the eyes at night', icon: 'moon-outline' },
  { mode: 'system', label: 'Match my phone', hint: 'Follows your phone setting', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  return (
    <Screen scroll bottomInset>
      <Text style={[typography.h3, styles.section, { color: colors.text }]}>Appearance</Text>
      <View style={styles.list}>
        {OPTIONS.map((option) => {
          const selected = mode === option.mode;
          return (
            <Pressable
              key={option.mode}
              onPress={() => setMode(option.mode)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.row,
                { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border },
              ]}>
              <Ionicons name={option.icon} size={22} color={selected ? colors.primary : colors.textMuted} />
              <View style={styles.flex}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{option.label}</Text>
                <Text style={[typography.small, { color: colors.textMuted }]}>{option.hint}</Text>
              </View>
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selected ? colors.primary : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={[typography.h3, styles.section, { color: colors.text }]}>About</Text>
      <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.flex}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>{APP_NAME}</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>
            Version {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { marginBottom: spacing.md, marginTop: spacing.sm },
  list: { gap: spacing.sm, marginBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
});
