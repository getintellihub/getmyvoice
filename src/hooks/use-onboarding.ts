import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'myvoice:onboarding-complete';

export function useOnboarding() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        setHasSeenOnboarding(raw === 'true');
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasSeenOnboarding(true);
    AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => undefined);
  }, []);

  return { isLoaded, hasSeenOnboarding, completeOnboarding };
}
