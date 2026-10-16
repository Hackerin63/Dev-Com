import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { friendlyError } from '@/utils/errors';
import { validateEmail, validateName, validatePassword } from '@/utils/validation';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { signUp, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const next = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: confirm === password ? null : 'Passwords do not match.',
    };
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);
    try {
      await signUp(name, email, password);
      await refreshProfile();
    } catch (e) {
      setFormError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll topInset bottomInset contentStyle={styles.content}>
      <Text style={[typography.h1, { color: colors.text }]}>Create your account</Text>
      <Text style={[typography.body, styles.lead, { color: colors.textMuted }]}>
        It takes less than a minute.
      </Text>

      <TextField label="Full name" value={name} onChangeText={setName} error={errors.name} autoComplete="name" placeholder="Your name" maxLength={100} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoCapitalize="none"
        placeholder="At least 6 characters"
      />
      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
        secureTextEntry
        autoCapitalize="none"
        placeholder="Repeat your password"
        onSubmitEditing={submit}
      />

      {formError ? (
        <Text style={[typography.small, styles.formError, { color: colors.danger, backgroundColor: colors.dangerSoft }]}>
          {formError}
        </Text>
      ) : null}

      <Button title="Create account" onPress={submit} loading={busy} />

      <View style={styles.footer}>
        <Text style={[typography.body, { color: colors.textMuted }]}>Already have an account? </Text>
        <Link href="/login" style={[typography.bodyStrong, { color: colors.primary }]}>
          Sign in
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  lead: { marginTop: spacing.xs, marginBottom: spacing.xl },
  formError: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
});
