import { useCallback, useEffect, useState } from 'react';

import { ensureUserDataHydrated, syncSetCustomPhrases } from '@/services/user-data-sync';
import type { CustomPhrase } from '@/types/synced-user-data';

export type { CustomPhrase };

export function useCustomPhrases() {
  const [phrases, setPhrases] = useState<CustomPhrase[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    ensureUserDataHydrated()
      .then((data) => setPhrases(data.customPhrases))
      .finally(() => setIsLoaded(true));
  }, []);

  const addPhrase = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPhrases((previous) => {
      const next = [...previous, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: trimmed }];
      syncSetCustomPhrases(next).catch(() => undefined);
      return next;
    });
  }, []);

  const removePhrase = useCallback((id: string) => {
    setPhrases((previous) => {
      const next = previous.filter((phrase) => phrase.id !== id);
      syncSetCustomPhrases(next).catch(() => undefined);
      return next;
    });
  }, []);

  return { phrases, isLoaded, addPhrase, removePhrase };
}
