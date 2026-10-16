import { router } from 'expo-router';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CartItemRow } from '@/components/CartItemRow';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { radius, spacing, typography } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { formatPrice } from '@/utils/format';

export default function CartScreen() {
  const { colors } = useTheme();
  const { items, total, count, setQuantity, removeItem, clear } = useCart();

  function confirmClear() {
    Alert.alert('Clear cart?', 'This removes every item from your cart.', [
      { text: 'Keep items', style: 'cancel' },
      { text: 'Clear cart', style: 'destructive', onPress: clear },
    ]);
  }

  if (items.length === 0) {
    return (
      <Screen topInset>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Add something you like and it will show up here."
          actionLabel="Browse products"
          onAction={() => router.navigate('/')}
        />
      </Screen>
    );
  }

  return (
    <Screen topInset padded={false}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.text }]}>Cart</Text>
        <Button title="Clear" variant="ghost" small onPress={confirmClear} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onQuantityChange={(next) => setQuantity(item.productId, next)}
            onRemove={() => removeItem(item.productId)}
            onPress={() => router.push(`/product/${item.productId}`)}
          />
        )}
      />
      <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Subtotal ({count} {count === 1 ? 'item' : 'items'})
          </Text>
          <Text style={[typography.h3, { color: colors.text }]}>{formatPrice(total)}</Text>
        </View>
        <Text style={[typography.small, { color: colors.textMuted }]}>Pay with cash when your order arrives.</Text>
        <Button title="Checkout" onPress={() => router.push('/checkout')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  list: { padding: spacing.lg },
  summary: {
    borderTopWidth: 1,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
