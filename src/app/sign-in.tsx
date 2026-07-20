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
import { signInWithEmail } from '@/services/auth';
import { setOnboardingComplete } from '@/services/user-data-sync';

export default function SignInScreen() {
  const router = useRouter();
  const { noteSignedInAsNewUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const google = useGoogleSignIn({
    onSuccess: async (result) => {
      if (result.isNewUser) {
        noteSignedInAsNewUser();
        await setOnboardingComplete(false);
      }
      router.replace('/' as Href);
    },
    onError: (message) => setError(message),
  });

  async function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setBusy(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.isNewUser) noteSignedInAsNewUser();
      router.replace('/' as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
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
          <Text style={styles.subtitle}>Sign in to sync your voice across devices</Text>

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
            autoComplete="password"
            placeholder="Your password"
            placeholderTextColor={VoiceTheme.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
            activeOpacity={0.7}
            onPress={() => router.push('/forgot-password' as Href)}
            style={styles.linkRow}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            activeOpacity={0.7}
            disabled={loading}
            onPress={() => {
              void handleSignIn();
            }}
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}>
            {busy ? (
              <ActivityIndicator color={VoiceTheme.onAccent} />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
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
            accessibilityLabel="Go to sign up"
            activeOpacity={0.7}
            onPress={() => router.push('/sign-up' as Href)}
            style={styles.linkRow}>
            <Text style={styles.mutedLink}>
              New here? <Text style={styles.linkText}>Create an account</Text>
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
