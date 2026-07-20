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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authStyles } from '@/constants/auth-styles';
import { VoiceTheme } from '@/constants/voice-theme';
import { useGoogleSignIn } from '@/hooks/use-google-sign-in';
import { useAuth } from '@/providers/auth-provider';
import { signUpWithEmail } from '@/services/auth';
import { setOnboardingComplete } from '@/services/user-data-sync';

export default function SignUpScreen() {
  const router = useRouter();
  const { noteSignedInAsNewUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const google = useGoogleSignIn({
    onSuccess: async (result) => {
      if (result.isNewUser) {
        noteSignedInAsNewUser();
        await setOnboardingComplete(false);
      }
      router.replace('/home' as Href);
    },
    onError: (message) => setError(message),
  });

  async function handleSignUp() {
    setError(null);
    if (!email.trim() || !password || !confirmPassword) {
      setError('Fill in email, password, and confirm password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      await signUpWithEmail(email, password);
      noteSignedInAsNewUser();
      await setOnboardingComplete(false);
      router.replace('/home' as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.');
    } finally {
      setBusy(false);
    }
  }

  const loading = busy || google.busy;

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
          <Text style={styles.subtitle}>Create an account to save your voice everywhere</Text>

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

          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            placeholderTextColor={VoiceTheme.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder="Re-enter password"
            placeholderTextColor={VoiceTheme.textMuted}
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Create account"
            activeOpacity={0.7}
            disabled={loading}
            onPress={() => {
              void handleSignUp();
            }}
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}>
            {busy ? (
              <ActivityIndicator color={VoiceTheme.onAccent} />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            activeOpacity={0.7}
            disabled={loading}
            onPress={() => {
              void google.promptGoogleSignIn();
            }}
            style={[styles.googleButton, loading && styles.primaryButtonDisabled]}>
            {google.busy ? (
              <ActivityIndicator color={VoiceTheme.text} />
            ) : (
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go to sign in"
            activeOpacity={0.7}
            onPress={() => router.replace('/sign-in' as Href)}
            style={styles.linkRow}>
            <Text style={styles.mutedLink}>
              Already have an account? <Text style={styles.linkText}>Sign in</Text>
            </Text>
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
