import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorView } from '@/components/ErrorView';
import { LoadingView } from '@/components/LoadingView';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPaymentSettings, saveUpiId } from '@/services/paymentSettingsService';
import { friendlyError } from '@/utils/errors';
import { validateUpiId } from '@/utils/validation';

export default function PaymentSettingsScreen() {
  const { colors } = useTheme();
  const { data, loading, error, reload } = useAsyncData(getPaymentSettings);
  const [upiIdInput, setUpiIdInput] = useState<string | null>(null);
  const upiId = upiIdInput ?? data?.upiId ?? '';
  const [upiError, setUpiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const validationError = validateUpiId(upiId);
    setUpiError(validationError);
    if (validationError) return;

    setSaving(true);
    try {
      await saveUpiId(upiId);
      setUpiIdInput(upiId.trim());
      await reload();
      Alert.alert('Payment settings saved', upiId.trim() ? 'UPI is available at checkout.' : 'UPI has been disabled.');
    } catch (saveError) {
      Alert.alert('Could not save payment settings', friendlyError(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) return <LoadingView />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  return (
    <Screen scroll bottomInset>
      <Text style={[typography.h3, { color: colors.text, marginBottom: 8 }]}>UPI payments</Text>
      <Text style={[typography.body, { color: colors.textMuted, marginBottom: 20 }]}>
        Add the shop UPI ID customers should pay. Leave it blank to disable UPI at checkout.
      </Text>
      <TextField
        label="Shop UPI ID"
        value={upiId}
        onChangeText={(value) => {
          setUpiIdInput(value);
          setUpiError(null);
        }}
        error={upiError}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        maxLength={200}
        placeholder="shopname@bank"
      />
      <Text style={[typography.small, { color: colors.textMuted, marginBottom: 20 }]}>
        UPI transfers are not verified automatically. Check your UPI app or bank statement before marking an order paid.
      </Text>
      <Button title="Save payment settings" icon="save-outline" onPress={save} loading={saving} />
    </Screen>
  );
}