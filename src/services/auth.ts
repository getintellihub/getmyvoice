import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';

import { auth } from '@/firebase';

export type AuthResult = {
  user: User;
  isNewUser: boolean;
};

function isNewUserFromCredential(credential: UserCredential): boolean {
  const info = credential as UserCredential & {
    additionalUserInfo?: { isNewUser?: boolean } | null;
  };
  if (typeof info.additionalUserInfo?.isNewUser === 'boolean') {
    return info.additionalUserInfo.isNewUser;
  }
  // Fallback: brand-new accounts have creation ≈ last sign-in.
  const created = credential.user.metadata.creationTime
    ? Date.parse(credential.user.metadata.creationTime)
    : 0;
  const lastSignIn = credential.user.metadata.lastSignInTime
    ? Date.parse(credential.user.metadata.lastSignInTime)
    : 0;
  return Boolean(created && lastSignIn && Math.abs(lastSignIn - created) < 10_000);
}

function formatAuthError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code)
      : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    default:
      if (error instanceof Error && error.message.trim()) return error.message.trim();
      return 'Something went wrong. Please try again.';
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResult> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName?.trim()) {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    }
    return { user: credential.user, isNewUser: true };
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { user: credential.user, isNewUser: isNewUserFromCredential(credential) };
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function signInWithGoogleIdToken(idToken: string): Promise<AuthResult> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return { user: result.user, isNewUser: isNewUserFromCredential(result) };
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

/** Web-only Google popup flow. Native uses expo-auth-session id token. */
export async function signInWithGooglePopup(): Promise<AuthResult> {
  if (Platform.OS !== 'web') {
    throw new Error('Use the Google button flow on this platform.');
  }
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, isNewUser: isNewUserFromCredential(result) };
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
