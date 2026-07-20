// Firebase project config + Auth / Firestore initialization.
//
// Voice cloning and TTS run on the Railway Express server (see src/api.js
// and server.js). The ElevenLabs API key lives only as Railway env var
// ELEVENLABS_API_KEY — never in the app.
//
// Firestore user docs are keyed by Firebase Auth UID (users/{uid}).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey: 'AIzaSyAyBtQ8rEOiPFiOUr4Y7hqcwoRYS0nWRLU',
  authDomain: 'getmyvoice-83d97.firebaseapp.com',
  projectId: 'getmyvoice-83d97',
  storageBucket: 'getmyvoice-83d97.firebasestorage.app',
  messagingSenderId: '882330948987',
  appId: '1:882330948987:web:730892c57e911d89b819de',
};

/**
 * Google OAuth web client ID (Firebase console → Authentication → Google).
 * Override with EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.
 */
export const GOOGLE_WEB_CLIENT_ID =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) || '';

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  try {
    // RN persistence lives on the React Native auth build. Import lazily so
    // web bundles do not break if the export is tree-shaken away.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rnAuth = require('firebase/auth');
    const getReactNativePersistence = rnAuth.getReactNativePersistence;
    if (typeof getReactNativePersistence === 'function') {
      return initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
    return getAuth(firebaseApp);
  } catch {
    // Auth already initialized (Fast Refresh) — reuse it.
    return getAuth(firebaseApp);
  }
}

export const auth = createAuth();
export const db = getFirestore(firebaseApp);

// Re-export API helpers so existing imports from '@/firebase' keep working.
export { API_BASE_URL, API_ROUTES, getApiUrl, getCloudFunctionUrl } from './api';
