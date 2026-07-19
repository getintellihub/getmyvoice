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

// The region your Cloud Functions are deployed to. "us-central1" is the
// Firebase default unless you changed it in functions/index.js.
const FUNCTIONS_REGION = 'us-central1';

/**
 * Builds the HTTPS URL for a deployed Cloud Function (e.g. "cloneVoice" or
 * "speak"). We call functions directly over HTTPS with fetch — rather than
 * the Firebase JS SDK's callable client — so multipart audio uploads work
 * the same way in Expo Go as they do in a production build.
 */
export function getCloudFunctionUrl(functionName) {
  return `https://${FUNCTIONS_REGION}-${firebaseConfig.projectId}.cloudfunctions.net/${functionName}`;
}
