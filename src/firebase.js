// Firebase project config + app/Firestore initialization.
//
// Voice cloning and TTS run on the Railway Express server (see src/api.js
// and server.js). The ElevenLabs API key lives only as Railway env var
// ELEVENLABS_API_KEY — never in the app.
//
// Firestore syncs userVoiceId, custom phrases, voice settings, and history
// across installs that share the same device/user document id (see
// services/device-id.ts). Auth will replace the device id later.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyAyBtQ8rEOiPFiOUr4Y7hqcwoRYS0nWRLU',
  authDomain: 'getmyvoice-83d97.firebaseapp.com',
  projectId: 'getmyvoice-83d97',
  storageBucket: 'getmyvoice-83d97.firebasestorage.app',
  messagingSenderId: '882330948987',
  appId: '1:882330948987:web:730892c57e911d89b819de',
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);

// Re-export API helpers so existing imports from '@/firebase' keep working.
export { API_BASE_URL, API_ROUTES, getApiUrl, getCloudFunctionUrl } from './api';
