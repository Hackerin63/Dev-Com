import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export function LoadingView({ message }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Image
        source={require('../../assets/images/devcom-brand-1024.png')}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="Dev-Com"
      />
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={[typography.small, styles.text, { color: colors.textMuted }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  logo: { width: 152, height: 152, marginBottom: spacing.lg },
  text: { marginTop: spacing.md },
});
