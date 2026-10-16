import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Screen } from './Screen';

/** Shown instead of the app until real Firebase values are present in .env. */
export function SetupRequired() {
  const { colors } = useTheme();
  const steps = [
    'Create a Firebase project and a Web app (see the setup guide).',
    'Copy .env.example to .env and paste your Firebase values.',
    'Restart Expo with: npx expo start -c',
  ];
  return (
    <Screen scroll topInset bottomInset>
      <Text style={[typography.h1, { color: colors.text }]}>Dev-Com needs Firebase</Text>
      <Text style={[typography.body, styles.lead, { color: colors.textMuted }]}>
        No Firebase configuration was found, so sign-in and the shop are switched off.
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {steps.map((step, index) => (
          <Text key={step} style={[typography.body, { color: colors.text }, index > 0 && styles.step]}>
            {index + 1}. {step}
          </Text>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  step: { marginTop: spacing.md },
});
