import { Redirect, Stack } from 'expo-router';

import { LoadingView } from '@/components/LoadingView';
import { SetupRequired } from '@/components/SetupRequired';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { isFirebaseConfigured } from '@/services/firebase';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (!isFirebaseConfigured) return <SetupRequired />;
  if (loading) return <LoadingView />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ title: '' }} />
      <Stack.Screen name="category/[name]" options={{ title: 'Category' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Order details' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
