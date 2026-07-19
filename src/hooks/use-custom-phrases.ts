import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'myvoice:custom-phrases';

export interface CustomPhrase {
  id: string;
  text: string;
}

export function useCustomPhrases() {
  const [phrases, setPhrases] = useState<CustomPhrase[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setPhrases(JSON.parse(raw));
    });
  }, []);

  const persist = useCallback((next: CustomPhrase[]) => {
    setPhrases(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const addPhrase = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setPhrases((previous) => {
        const next = [...previous, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: trimmed }];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
        return next;
      });
    },
    [],
  );

  const removePhrase = useCallback(
    (id: string) => {
      setPhrases((previous) => {
        const next = previous.filter((phrase) => phrase.id !== id);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
        return next;
      });
    },
    [],
  );

  return { phrases, addPhrase, removePhrase };
}
