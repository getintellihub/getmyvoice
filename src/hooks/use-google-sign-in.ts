import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { GOOGLE_WEB_CLIENT_ID } from '@/firebase';
import { signInWithGoogleIdToken, signInWithGooglePopup, type AuthResult } from '@/services/auth';

WebBrowser.maybeCompleteAuthSession();

type GoogleSignInOptions = {
  onSuccess?: (result: AuthResult) => void;
  onError?: (message: string) => void;
};

/**
 * Google Sign-In for Expo:
 * - Web → Firebase signInWithPopup
 * - Native → expo-auth-session id token → Firebase credential
 *
 * Requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Firebase Google provider web client id)
 * for native builds / Expo Go.
 */
export function useGoogleSignIn(options: GoogleSignInOptions = {}) {
  const [busy, setBusy] = useState(false);
  const hasWebClientId = Boolean(GOOGLE_WEB_CLIENT_ID);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    hasWebClientId
      ? {
          clientId: GOOGLE_WEB_CLIENT_ID,
          iosClientId: GOOGLE_WEB_CLIENT_ID,
          androidClientId: GOOGLE_WEB_CLIENT_ID,
        }
      : {
          // Placeholder so the hook stays stable when unset; prompt is guarded.
          clientId: 'unset.apps.googleusercontent.com',
        },
  );

  useEffect(() => {
    if (response?.type !== 'success') return;

    const idToken = response.params.id_token;
    if (!idToken) {
      options.onError?.('Google did not return an ID token.');
      return;
    }

    setBusy(true);
    signInWithGoogleIdToken(idToken)
      .then((result) => options.onSuccess?.(result))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Google sign-in failed.';
        options.onError?.(message);
      })
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per response
  }, [response]);

  async function promptGoogleSignIn() {
    setBusy(true);
    try {
      if (Platform.OS === 'web') {
        const result = await signInWithGooglePopup();
        options.onSuccess?.(result);
        return;
      }

      if (!hasWebClientId) {
        throw new Error(
          'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your Firebase Google web client ID.',
        );
      }

      if (!request) {
        throw new Error('Google Sign-In is still loading. Please try again.');
      }

      await promptAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed.';
      options.onError?.(message);
    } finally {
      setBusy(false);
    }
  }

  return {
    promptGoogleSignIn,
    busy,
    ready: Platform.OS === 'web' || (hasWebClientId && !!request),
  };
}
