import { Redirect, Stack } from 'expo-router';

import { LoadingView } from '@/components/LoadingView';
import { SetupRequired } from '@/components/SetupRequired';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { isFirebaseConfigured } from '@/services/firebase';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (!isFirebaseConfigured) return <SetupRequired />;
  if (loading) return <LoadingView />;
  if (user) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
