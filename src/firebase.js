// Firebase project config from the Firebase console.
//
// NOTE: These values identify your Firebase project — they are safe to ship
// in the app. The ElevenLabs API key is NOT stored here; it lives only in
// Firebase's server-side secret manager (see functions/index.js) and is
// never exposed to the app.
export const firebaseConfig = {
  apiKey: 'AIzaSyAyBtQ8rEOiPFiOUr4Y7hqcwoRYS0nWRLU',
  authDomain: 'getmyvoice-83d97.firebaseapp.com',
  projectId: 'getmyvoice-83d97',
  storageBucket: 'getmyvoice-83d97.firebasestorage.app',
  messagingSenderId: '882330948987',
  appId: '1:882330948987:web:730892c57e911d89b819de',
};

// Deployed HTTPS Cloud Functions (us-central1 / getmyvoice-83d97).
export const CLOUD_FUNCTION_URLS = {
  cloneVoice: 'https://us-central1-getmyvoice-83d97.cloudfunctions.net/cloneVoice',
  speak: 'https://us-central1-getmyvoice-83d97.cloudfunctions.net/speak',
};

/**
 * Returns the HTTPS URL for a deployed Cloud Function.
 * We call functions directly over HTTPS with fetch — rather than the Firebase
 * JS SDK's callable client — so multipart audio uploads work the same way in
 * Expo Go as they do in a production build.
 */
export function getCloudFunctionUrl(functionName) {
  const url = CLOUD_FUNCTION_URLS[functionName];
  if (!url) {
    throw new Error(`Unknown Cloud Function: ${functionName}`);
  }
  return url;
}
