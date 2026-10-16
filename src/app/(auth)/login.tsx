import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { APP_NAME } from '@/constants/config';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { sendResetEmail } from '@/services/authService';
import { friendlyError } from '@/utils/errors';
import { validateEmail } from '@/utils/validation';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const next = {
      email: validateEmail(email),
      password: password ? null : 'Enter your password.',
    };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;

    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setFormError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    const problem = validateEmail(email);
    if (problem) {
      setErrors({ email: 'Enter your email above first, then tap "Forgot password?".' });
      return;
    }
    try {
      await sendResetEmail(email);
      Alert.alert('Check your inbox', `If an account exists for ${email.trim()}, a reset link is on its way.`);
    } catch (e) {
      Alert.alert('Could not send the email', friendlyError(e));
    }
  }

  return (
    <Screen scroll topInset bottomInset contentStyle={styles.content}>
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={[typography.h2, { color: colors.primaryText }]}>D-C</Text>
        </View>
        <Text style={[typography.h1, { color: colors.text }]}>{APP_NAME}</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>Sign in to start shopping.</Text>
      </View>

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
        autoComplete="password"
        placeholder="Your password"
        onSubmitEditing={submit}
      />

      {formError ? (
        <Text style={[typography.small, styles.formError, { color: colors.danger, backgroundColor: colors.dangerSoft }]}>
          {formError}
        </Text>
      ) : null}

      <Button title="Sign in" onPress={submit} loading={busy} />

      <Pressable onPress={forgotPassword} style={styles.forgot} hitSlop={8}>
        <Text style={[typography.small, { color: colors.primary, fontWeight: '600' }]}>Forgot password?</Text>
      </Pressable>

      <View style={styles.footer}>
        <Text style={[typography.body, { color: colors.textMuted }]}>New to {APP_NAME}? </Text>
        <Link href="/register" style={[typography.bodyStrong, { color: colors.primary }]}>
          Create an account
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  brand: { alignItems: 'flex-start', gap: spacing.xs, marginBottom: spacing.xxl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  formError: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden' },
  forgot: { alignSelf: 'center', marginTop: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
});
