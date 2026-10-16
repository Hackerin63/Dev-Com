import type { ReactNode } from 'react';
import { KeyboardAvoidingView, RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. */
  scroll?: boolean;
  /** Apply the status-bar inset (use when the screen has no native header). */
  topInset?: boolean;
  /** Apply the bottom inset (use when there is no tab bar below). */
  bottomInset?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  topInset = false,
  bottomInset = false,
  padded = true,
  refreshing,
  onRefresh,
  contentStyle,
}: ScreenProps) {
  const { colors } = useTheme();
  const edges: Edge[] = [];
  if (topInset) edges.push('top');
  if (bottomInset) edges.push('bottom');
  edges.push('left', 'right');

  const inner = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[padded && styles.padded, styles.scrollContent, contentStyle]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        ) : undefined
      }>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.grow, padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.grow, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.grow}>
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1, flex: 1 },
  scrollContent: { flexGrow: 1 },
  padded: { padding: spacing.lg },
});
