import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, Tabs } from 'expo-router';
import { Pressable, Text, type ColorValue } from 'react-native';

import { typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  };
}

/**
 * Admin area. The redirect below is only a convenience: real protection lives in the
 * Firestore security rules, which reject every admin read/write without the admin claim.
 */
export default function AdminLayout() {
  const { isAdmin } = useAuth();
  const { colors } = useTheme();

  if (!isAdmin) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerRight: () => (
          <Pressable onPress={() => router.replace('/')} hitSlop={10} style={{ marginRight: 16 }}>
            <Text style={[typography.bodyStrong, { color: colors.primary }]}>Exit admin</Text>
          </Pressable>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: tabIcon('speedometer', 'speedometer-outline') }} />
      <Tabs.Screen name="manage-products" options={{ title: 'Products', tabBarIcon: tabIcon('cube', 'cube-outline') }} />
      <Tabs.Screen name="manage-orders" options={{ title: 'Orders', tabBarIcon: tabIcon('receipt', 'receipt-outline') }} />
      <Tabs.Screen name="payment-settings" options={{ title: 'Payments', tabBarIcon: tabIcon('card', 'card-outline') }} />
      <Tabs.Screen name="manage-users" options={{ title: 'Users', tabBarIcon: tabIcon('people', 'people-outline') }} />
      <Tabs.Screen
        name="product-form"
        options={{ title: 'Product', href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}
