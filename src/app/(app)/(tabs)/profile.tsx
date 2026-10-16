import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { friendlyError } from '@/utils/errors';
import { validateAddress, validateName, validatePhone } from '@/utils/validation';

type IconName = keyof typeof Ionicons.glyphMap;

function MenuRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.menuRow,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={[typography.bodyStrong, styles.flex, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, profile, isAdmin, signOut, saveProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);

  const displayName = profile?.displayName || user?.displayName || 'Shopper';

  function startEditing() {
    setName(profile?.displayName ?? user?.displayName ?? '');
    setPhone(profile?.phone ?? '');
    setAddress(profile?.address ?? '');
    setErrors({});
    setEditing(true);
  }

  async function save() {
    const next = {
      name: validateName(name),
      phone: phone.trim() ? validatePhone(phone) : null,
      address: address.trim() ? validateAddress(address) : null,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    try {
      await saveProfile({ displayName: name, phone, address });
      setEditing(false);
    } catch (e) {
      Alert.alert('Could not save your profile', friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  function confirmSignOut() {
    Alert.alert('Sign out?', 'You can sign back in at any time. Your cart stays saved on this phone.', [
      { text: 'Stay signed in', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut().catch((e) => Alert.alert('Could not sign out', friendlyError(e)));
        },
      },
    ]);
  }

  return (
    <Screen scroll topInset>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[typography.h1, { color: colors.primaryText }]}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={[typography.h2, { color: colors.text }]}>{displayName}</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>{user?.email}</Text>
          {isAdmin ? (
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>Administrator</Text>
          ) : null}
        </View>
      </View>

      {editing ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextField label="Full name" value={name} onChangeText={setName} error={errors.name} autoComplete="name" maxLength={100} />
          <TextField
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={20}
          />
          <TextField
            label="Delivery address"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
            multiline
            maxLength={500}
          />
          <View style={styles.buttons}>
            <Button title="Cancel" variant="secondary" onPress={() => setEditing(false)} style={styles.flex} />
            <Button title="Save" onPress={save} loading={busy} style={styles.flex} />
          </View>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.small, { color: colors.textMuted }]}>Phone</Text>
          <Text style={[typography.body, styles.value, { color: colors.text }]}>{profile?.phone || 'Not added yet'}</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>Delivery address</Text>
          <Text style={[typography.body, styles.value, { color: colors.text }]}>{profile?.address || 'Not added yet'}</Text>
          <Button title="Edit profile" variant="secondary" icon="create-outline" small onPress={startEditing} />
        </View>
      )}

      <View style={styles.menu}>
        <MenuRow icon="receipt-outline" label="My orders" onPress={() => router.navigate('/orders')} />
        <MenuRow icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
        {isAdmin ? (
          <MenuRow icon="shield-checkmark-outline" label="Admin dashboard" onPress={() => router.push('/dashboard')} />
        ) : null}
      </View>

      <Button title="Sign out" variant="danger" icon="log-out-outline" onPress={confirmSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  avatar: { width: 68, height: 68, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: 2 },
  value: { marginBottom: spacing.md },
  buttons: { flexDirection: 'row', gap: spacing.md },
  menu: { gap: spacing.sm, marginVertical: spacing.xl },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
});
