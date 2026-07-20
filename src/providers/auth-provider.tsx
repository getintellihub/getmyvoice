import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { auth } from '@/firebase';
import { signOut as authSignOut } from '@/services/auth';
import {
  clearLocalUserCache,
  ensureUserDataHydrated,
  resetUserDataHydration,
  setOnboardingComplete,
} from '@/services/user-data-sync';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isNewUserSession: boolean;
  hasCompletedOnboarding: boolean;
  onboardingLoaded: boolean;
  markOnboardingComplete: () => Promise<void>;
  clearNewUserSession: () => void;
  signOut: () => Promise<void>;
  /** Call after email/Google sign-up so onboarding can show once. */
  noteSignedInAsNewUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUserSession, setIsNewUserSession] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const pendingNewUserRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setIsLoading(true);
      setUser(nextUser);

      if (!nextUser) {
        resetUserDataHydration();
        pendingNewUserRef.current = false;
        setIsNewUserSession(false);
        setHasCompletedOnboarding(true);
        setOnboardingLoaded(true);
        setIsLoading(false);
        return;
      }

      resetUserDataHydration();
      try {
        if (pendingNewUserRef.current) {
          pendingNewUserRef.current = false;
          setIsNewUserSession(true);
          setHasCompletedOnboarding(false);
          await setOnboardingComplete(false);
        } else {
          const data = await ensureUserDataHydrated(nextUser.uid);
          setIsNewUserSession(false);
          setHasCompletedOnboarding(Boolean(data.onboardingComplete));
        }
      } catch (error) {
        console.warn('[AuthProvider] hydrate failed', error);
        setHasCompletedOnboarding(false);
      } finally {
        setOnboardingLoaded(true);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const noteSignedInAsNewUser = useCallback(() => {
    pendingNewUserRef.current = true;
    setIsNewUserSession(true);
    setHasCompletedOnboarding(false);
  }, []);

  const clearNewUserSession = useCallback(() => {
    pendingNewUserRef.current = false;
    setIsNewUserSession(false);
  }, []);

  const markOnboardingComplete = useCallback(async () => {
    setHasCompletedOnboarding(true);
    setIsNewUserSession(false);
    pendingNewUserRef.current = false;
    await setOnboardingComplete(true);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    await clearLocalUserCache();
    resetUserDataHydration();
    pendingNewUserRef.current = false;
    setIsNewUserSession(false);
    setHasCompletedOnboarding(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isNewUserSession,
      hasCompletedOnboarding,
      onboardingLoaded,
      markOnboardingComplete,
      clearNewUserSession,
      signOut,
      noteSignedInAsNewUser,
    }),
    [
      user,
      isLoading,
      isNewUserSession,
      hasCompletedOnboarding,
      onboardingLoaded,
      markOnboardingComplete,
      clearNewUserSession,
      signOut,
      noteSignedInAsNewUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
