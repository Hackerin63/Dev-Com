import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  max: number;
  min?: number;
}

export function QuantityStepper({ value, onChange, max, min = 0 }: QuantityStepperProps) {
  const { colors } = useTheme();
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceAlt }]}>
      <Pressable
        onPress={() => onChange(value - 1)}
        disabled={!canDecrease}
        hitSlop={6}
        accessibilityLabel="Decrease quantity"
        style={[styles.btn, { opacity: canDecrease ? 1 : 0.35 }]}>
        <Ionicons name="remove" size={18} color={colors.text} />
      </Pressable>
      <Text style={[typography.bodyStrong, styles.value, { color: colors.text }]}>{value}</Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        disabled={!canIncrease}
        hitSlop={6}
        accessibilityLabel="Increase quantity"
        style={[styles.btn, { opacity: canIncrease ? 1 : 0.35 }]}>
        <Ionicons name="add" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, padding: 2 },
  btn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 28, textAlign: 'center', marginHorizontal: spacing.xs },
});
