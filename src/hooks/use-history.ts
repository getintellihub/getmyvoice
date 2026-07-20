import { useCallback, useEffect, useState } from 'react';

import { ensureUserDataHydrated, syncSetHistory } from '@/services/user-data-sync';
import type { HistoryEntry } from '@/types/synced-user-data';

export type { HistoryEntry };

const MAX_HISTORY_ITEMS = 20;

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    ensureUserDataHydrated()
      .then((data) => setHistory(data.history))
      .catch((error) => console.warn('[useHistory] hydrate failed', error))
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = useCallback((next: HistoryEntry[]) => {
    setHistory(next);
    syncSetHistory(next).catch(() => undefined);
  }, []);

  const addToHistory = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setHistory((previous) => {
      const withoutDuplicate = previous.filter((entry) => entry.text !== trimmed);
      const next = [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: trimmed, spokenAt: Date.now() },
        ...withoutDuplicate,
      ].slice(0, MAX_HISTORY_ITEMS);
      syncSetHistory(next).catch(() => undefined);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => persist([]), [persist]);

  return { history, isLoaded, addToHistory, clearHistory };
}
