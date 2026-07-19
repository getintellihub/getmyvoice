import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'myvoice:auto-speak-schedule';

export interface ScheduleEntry {
  id: string;
  time: string;
  phrase: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_SCHEDULE: ScheduleEntry[] = [
  { id: 'default-morning', time: '08:00', phrase: 'Good morning!', label: 'Morning greeting', enabled: false },
  { id: 'default-afternoon', time: '13:00', phrase: 'Good afternoon!', label: 'Afternoon greeting', enabled: false },
  { id: 'default-evening', time: '19:00', phrase: 'Good evening!', label: 'Evening greeting', enabled: false },
];

function isValidTime(time: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

export function useAutoSpeakSchedule(onTrigger: (phrase: string) => void) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(DEFAULT_SCHEDULE);
  const lastFiredMinuteRef = useRef<Record<string, string>>({});
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSchedule(JSON.parse(raw));
    });
  }, []);

  const persist = useCallback((next: ScheduleEntry[]) => {
    setSchedule(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const addEntry = useCallback(
    (entry: { time: string; phrase: string; label: string }) => {
      if (!isValidTime(entry.time) || !entry.phrase.trim()) return;
      setSchedule((previous) => {
        const next = [
          ...previous,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            time: entry.time,
            phrase: entry.phrase.trim(),
            label: entry.label.trim() || entry.phrase.trim(),
            enabled: true,
          },
        ].sort((a, b) => a.time.localeCompare(b.time));
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
        return next;
      });
    },
    [],
  );

  const toggleEntry = useCallback((id: string) => {
    setSchedule((previous) => {
      const next = previous.map((entry) => (entry.id === id ? { ...entry, enabled: !entry.enabled } : entry));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setSchedule((previous) => {
      const next = previous.filter((entry) => entry.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  useEffect(() => {
    function check() {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const minuteKey = `${now.toDateString()} ${currentTime}`;

      for (const entry of schedule) {
        if (!entry.enabled || entry.time !== currentTime) continue;
        if (lastFiredMinuteRef.current[entry.id] === minuteKey) continue;
        lastFiredMinuteRef.current[entry.id] = minuteKey;
        onTriggerRef.current(entry.phrase);
      }
    }

    check();
    const interval = setInterval(check, 20 * 1000);
    return () => clearInterval(interval);
  }, [schedule]);

  return { schedule, addEntry, toggleEntry, removeEntry };
}
