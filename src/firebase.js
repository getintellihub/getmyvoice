// Firebase project config from the Firebase console (kept for reference / future use).
//
// Voice cloning and TTS now run on the Railway Express server (see src/api.js
// and server.js). The ElevenLabs API key lives only as Railway env var
// ELEVENLABS_API_KEY — never in the app.
export const firebaseConfig = {
  apiKey: 'AIzaSyAyBtQ8rEOiPFiOUr4Y7hqcwoRYS0nWRLU',
  authDomain: 'getmyvoice-83d97.firebaseapp.com',
  projectId: 'getmyvoice-83d97',
  storageBucket: 'getmyvoice-83d97.firebasestorage.app',
  messagingSenderId: '882330948987',
  appId: '1:882330948987:web:730892c57e911d89b819de',
};

// Re-export API helpers so existing imports from '@/firebase' keep working.
export { API_BASE_URL, API_ROUTES, getApiUrl, getCloudFunctionUrl } from './api';
