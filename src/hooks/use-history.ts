import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'myvoice:history';
const MAX_HISTORY_ITEMS = 20;

export interface HistoryEntry {
  id: string;
  text: string;
  spokenAt: number;
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setHistory(JSON.parse(raw));
    });
  }, []);

  const persist = useCallback((next: HistoryEntry[]) => {
    setHistory(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const addToHistory = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setHistory((previous) => {
        const withoutDuplicate = previous.filter((entry) => entry.text !== trimmed);
        const next = [
          { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: trimmed, spokenAt: Date.now() },
          ...withoutDuplicate,
        ].slice(0, MAX_HISTORY_ITEMS);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
        return next;
      });
    },
    [],
  );

  const clearHistory = useCallback(() => persist([]), [persist]);

  return { history, addToHistory, clearHistory };
}
