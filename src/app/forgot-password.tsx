import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authStyles } from '@/constants/auth-styles';
import { VoiceTheme } from '@/constants/voice-theme';
import { sendPasswordReset } from '@/services/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError('Enter the email for your account.');
      return;
    }

    setBusy(true);
    try {
      await sendPasswordReset(email);
      setSuccess('Check your email for a password reset link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.brand}>MyVoice</Text>
          <Text style={styles.subtitle}>We'll email you a link to reset your password</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={VoiceTheme.textMuted}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Send reset email"
            activeOpacity={0.7}
            disabled={busy}
            onPress={() => {
              void handleReset();
            }}
            style={[styles.primaryButton, busy && styles.primaryButtonDisabled]}>
            {busy ? (
              <ActivityIndicator color={VoiceTheme.onAccent} />
            ) : (
              <Text style={styles.primaryButtonText}>Send Reset Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
            activeOpacity={0.7}
            onPress={() => router.replace('/sign-in' as Href)}
            style={styles.linkRow}>
            <Text style={styles.linkText}>← Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...authStyles,
  flex: { flex: 1 },
});
